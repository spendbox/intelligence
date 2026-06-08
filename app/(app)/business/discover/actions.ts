"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { env } from "@/lib/env";

export async function runDiscoveryScanAction() {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id, setup_complete")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!business) redirect("/business/setup");
  if (!business.setup_complete) redirect("/business/setup");

  const settings = await getSettings();
  const cost = Math.max(0, Number(settings.discover_scan_cost_credits) || 0);
  const cooldownSec = Math.max(0, Number(settings.discover_scan_cooldown_seconds) || 0);
  const cooldownIso = new Date(Date.now() - cooldownSec * 1000).toISOString();

  // Cooldown: any running scan, or any scan that started inside the window.
  const { data: recent } = await sb
    .from("discovered_scans")
    .select("id, status, started_at")
    .eq("business_id", business.id)
    .or(`status.eq.running,started_at.gte.${cooldownIso}`)
    .limit(1);
  if (recent && recent.length > 0) redirect("/business/discover?error=cooldown");

  const { data: wallet } = await sb
    .from("wallets")
    .select("credits")
    .eq("user_id", session.userId)
    .maybeSingle();
  const credits = Number(wallet?.credits ?? 0);
  if (credits < cost) redirect("/business/discover?error=credits");

  const scanId = randomUUID();
  const newBalance = Math.round((credits - cost) * 100) / 100;
  await sb.from("wallets").update({ credits: newBalance }).eq("user_id", session.userId);
  await sb.from("wallet_transactions").insert({
    user_id: session.userId,
    delta: -cost,
    reason: "scan",
    reference: `scan_${scanId}`,
    metadata: { business_id: business.id, scan_id: scanId },
  });

  const { error: scanErr } = await sb.from("discovered_scans").insert({
    id: scanId,
    business_id: business.id,
    status: "running",
    credits_spent: cost,
  });
  if (scanErr) {
    // Refund and bail.
    await sb.from("wallets").update({ credits }).eq("user_id", session.userId);
    await sb.from("wallet_transactions").insert({
      user_id: session.userId,
      delta: cost,
      reason: "refund",
      reference: `scan_refund_${scanId}`,
      metadata: { reason: "insert_failed" },
    });
    redirect("/business/discover?error=server");
  }

  // Fire-and-forget the background run. Don't await — Next.js server actions
  // would block the redirect otherwise.
  try {
    fetch(`${env.appUrl()}/api/discover/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.cronSecret()}`,
      },
      body: JSON.stringify({ scan_id: scanId }),
      cache: "no-store",
    }).catch(() => {});
  } catch {}

  revalidatePath("/business/discover");
  redirect(`/business/discover?scan=${scanId}`);
}

export async function dismissDiscoveredLeadAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/business/discover");

  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!business) redirect("/business/setup");

  await sb
    .from("discovered_leads")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id);

  revalidatePath("/business/discover");
  redirect("/business/discover");
}
