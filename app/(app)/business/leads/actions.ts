"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function unlockLeadAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/business/leads");

  const sb = supabaseAdmin();
  const { data: business } = await sb.from("businesses").select("id").eq("user_id", session.userId).maybeSingle();
  if (!business) redirect("/business/setup");

  // Already unlocked? short-circuit.
  const { data: existing } = await sb
    .from("lead_unlocks")
    .select("id")
    .eq("request_id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (existing) redirect(`/business/leads/${id}`);

  const { data: req } = await sb
    .from("lead_requests")
    .select("id, unlock_credits, unlocks_count, unlocks_cap, status")
    .eq("id", id)
    .single();
  if (!req || req.status !== "approved") redirect(`/business/leads/${id}`);
  if (req.unlocks_count >= req.unlocks_cap) redirect(`/business/leads/${id}?error=cap`);

  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle();
  const credits = Number(wallet?.credits ?? 0);
  const cost = Number(req.unlock_credits);
  if (credits < cost) redirect(`/business/leads/${id}?error=credits`);

  // Atomic-ish unlock: decrement wallet, insert unlock, bump request counter.
  const newBalance = Math.round((credits - cost) * 100) / 100;
  await sb.from("wallets").update({ credits: newBalance }).eq("user_id", session.userId);
  await sb.from("wallet_transactions").insert({
    user_id: session.userId,
    delta: -cost,
    reason: "unlock",
    reference: `unlock_${req.id}`,
    metadata: { request_id: req.id, business_id: business.id },
  });
  const { error: insErr } = await sb.from("lead_unlocks").insert({
    request_id: req.id,
    business_id: business.id,
    user_id: session.userId,
    credits_spent: cost,
  });
  if (insErr) {
    // Refund on conflict
    await sb.from("wallets").update({ credits }).eq("user_id", session.userId);
    redirect(`/business/leads/${id}`);
  }
  await sb.from("lead_requests").update({ unlocks_count: req.unlocks_count + 1 }).eq("id", req.id);

  redirect(`/business/leads/${id}`);
}
