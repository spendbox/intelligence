import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { env } from "@/lib/env";
import { nairaToCredits } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = env.appUrl();
  const reference = req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${base}/business/wallet?status=failed`);

  const sb = supabaseAdmin();

  // Idempotent: if we already credited this reference, just redirect to success.
  const { data: existing } = await sb.from("wallet_transactions").select("id").eq("reference", reference).maybeSingle();
  if (existing) return NextResponse.redirect(`${base}/business/wallet?status=success`);

  let v;
  try {
    v = await verifyTransaction(reference);
  } catch {
    return NextResponse.redirect(`${base}/business/wallet?status=failed`);
  }
  if (v.status !== "success") return NextResponse.redirect(`${base}/business/wallet?status=failed`);

  // Look up user via the reference convention OR by email.
  let userId: string | null = null;
  if (v.customer?.email) {
    const { data: u } = await sb.from("users").select("id").eq("email", v.customer.email).maybeSingle();
    userId = u?.id ?? null;
  }
  if (!userId) return NextResponse.redirect(`${base}/business/wallet?status=failed`);

  const naira = Math.round(v.amount / 100);
  const credits = nairaToCredits(naira);

  // Ensure wallet exists, then increment atomically via update.
  await sb.from("wallets").upsert({ user_id: userId }, { onConflict: "user_id" });
  const { data: w } = await sb.from("wallets").select("credits, total_topup_naira").eq("user_id", userId).single();
  await sb
    .from("wallets")
    .update({
      credits: (w?.credits ?? 0) + credits,
      total_topup_naira: (w?.total_topup_naira ?? 0) + naira,
    })
    .eq("user_id", userId);

  await sb.from("wallet_transactions").insert({
    user_id: userId,
    delta: credits,
    reason: "topup",
    reference,
    naira_amount: naira,
  });

  return NextResponse.redirect(`${base}/business/wallet?status=success`);
}
