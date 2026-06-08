import { supabaseAdmin } from "@/lib/supabase/server";
import { bonusCreditsFor, computeCreditsForNaira } from "@/lib/leads";

// Idempotent wallet top-up: keyed by `reference`.
// Returns { ok: true, credited } when newly applied, { ok: true, credited: 0 } when
// already applied for that reference, and { ok: false } on hard failure.
//
// Paystack top-ups get a tiered bonus on top of the base conversion. Admin
// manual credits never get a bonus.
export async function applyTopup(opts: {
  userId: string;
  naira: number;
  reference: string;
  source: "paystack" | "admin";
}): Promise<{ ok: boolean; credited: number; bonus: number; already?: boolean }> {
  const sb = supabaseAdmin();

  const { data: dup } = await sb
    .from("wallet_transactions")
    .select("id")
    .eq("reference", opts.reference)
    .maybeSingle();
  if (dup) return { ok: true, credited: 0, bonus: 0, already: true };

  const base = await computeCreditsForNaira(opts.naira);
  const bonus = opts.source === "paystack" ? bonusCreditsFor(base, opts.naira) : 0;
  const credits = Math.round((base + bonus) * 100) / 100;

  await sb.from("wallets").upsert({ user_id: opts.userId }, { onConflict: "user_id" });
  const { data: w } = await sb
    .from("wallets")
    .select("credits, total_topup_naira")
    .eq("user_id", opts.userId)
    .single();

  const { error: upErr } = await sb
    .from("wallets")
    .update({
      credits: (w?.credits ?? 0) + credits,
      total_topup_naira: (w?.total_topup_naira ?? 0) + opts.naira,
    })
    .eq("user_id", opts.userId);
  if (upErr) return { ok: false, credited: 0, bonus: 0 };

  const { error: txErr } = await sb.from("wallet_transactions").insert({
    user_id: opts.userId,
    delta: credits,
    reason: "topup",
    reference: opts.reference,
    naira_amount: opts.naira,
    metadata: { source: opts.source, base_credits: base, bonus_credits: bonus },
  });
  if (txErr) {
    // Roll back the wallet bump on failure
    await sb
      .from("wallets")
      .update({ credits: w?.credits ?? 0, total_topup_naira: w?.total_topup_naira ?? 0 })
      .eq("user_id", opts.userId);
    return { ok: false, credited: 0, bonus: 0 };
  }

  return { ok: true, credited: credits, bonus };
}
