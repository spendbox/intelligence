"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { buildQueries, type BusinessProfile } from "@/lib/discover/queries";
import { searchMany, domainOf } from "@/lib/discover/search";
import { extractLeads } from "@/lib/discover/extract";

// Hard cap on inline scan work so a slow upstream can't pin a server action
// forever. Tavily/OpenAI also have their own AbortController-backed timeouts.
const SCAN_BUDGET_MS = 75_000;
// Anything older than this stuck in "running" is treated as crashed.
const STALE_SCAN_MS = 3 * 60 * 1000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function refund(sb: any, userId: string, cost: number, scanId: string, reason: string) {
  if (cost <= 0) return;
  const { data: w } = await sb.from("wallets").select("credits").eq("user_id", userId).maybeSingle();
  const cur = Number(w?.credits ?? 0);
  await sb.from("wallets").update({ credits: cur + cost }).eq("user_id", userId);
  await sb.from("wallet_transactions").insert({
    user_id: userId,
    delta: cost,
    reason: "refund",
    reference: `scan_refund_${scanId}`,
    metadata: { scan_id: scanId, reason },
  });
}

export async function sweepStaleScans(businessId: string, userId: string) {
  const sb = supabaseAdmin();
  const cutoff = new Date(Date.now() - STALE_SCAN_MS).toISOString();
  const { data: stale } = await sb
    .from("discovered_scans")
    .select("id, credits_spent")
    .eq("business_id", businessId)
    .eq("status", "running")
    .lt("started_at", cutoff);
  for (const s of (stale ?? []) as any[]) {
    await sb
      .from("discovered_scans")
      .update({ status: "failed", error: "timeout (sweeper)", finished_at: new Date().toISOString() })
      .eq("id", s.id);
    await refund(sb, userId, Number(s.credits_spent) || 0, s.id, "sweeper_timeout");
  }
}

async function runScanInline(businessId: string, scanId: string, freeQuery: string) {
  const sb = supabaseAdmin();
  const [catsRes, locsRes, budgetsRes, bizRes] = await Promise.all([
    sb.from("business_categories").select("categories(name)").eq("business_id", businessId),
    sb.from("business_locations").select("location").eq("business_id", businessId),
    sb.from("business_budget_ranges").select("budget_min, budget_max").eq("business_id", businessId),
    sb.from("businesses").select("bio").eq("id", businessId).maybeSingle(),
  ]);

  const profile: BusinessProfile = {
    industries: (catsRes.data ?? []).map((c: any) => c.categories?.name).filter(Boolean) as string[],
    locations: (locsRes.data ?? []).map((l: any) => l.location).filter(Boolean),
    budgets: (budgetsRes.data ?? []).map((b: any) => ({
      min: Number(b.budget_min) || 0,
      max: Number(b.budget_max) || 0,
    })),
    bio: (bizRes.data as any)?.bio ?? null,
  };

  const queries = freeQuery
    ? [freeQuery, ...buildQueries(profile).slice(0, 2)]
    : buildQueries(profile);
  const hits = await searchMany(queries);
  const leads = await extractLeads(profile, hits);

  let inserted = 0;
  for (const lead of leads) {
    const { error } = await sb.from("discovered_leads").insert({
      business_id: businessId,
      scan_id: scanId,
      title: lead.title,
      summary: lead.summary,
      source_url: lead.source_url,
      source_domain: domainOf(lead.source_url),
      location: lead.location,
      budget_hint: lead.budget_hint,
      contact_hint: lead.contact_hint,
      posted_at: lead.posted_at,
      score: lead.score,
    });
    if (!error) inserted++;
  }

  await sb
    .from("discovered_scans")
    .update({
      status: "completed",
      results_count: inserted,
      query: { q: freeQuery || null, queries, hit_count: hits.length },
      finished_at: new Date().toISOString(),
    })
    .eq("id", scanId);
}

export async function runDiscoveryScanAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const q = String(formData?.get("q") ?? "").trim().slice(0, 240);
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id, setup_complete")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!business) redirect("/business/setup");
  if (!business.setup_complete) redirect("/business/setup");

  // Auto-recover stuck scans from a previous crashed run.
  await sweepStaleScans(business.id, session.userId);

  const settings = await getSettings();
  const cost = Math.max(0, Number(settings.discover_scan_cost_credits) || 0);
  const cooldownSec = Math.max(0, Number(settings.discover_scan_cooldown_seconds) || 0);
  const cooldownIso = new Date(Date.now() - cooldownSec * 1000).toISOString();

  const { data: recent } = await sb
    .from("discovered_scans")
    .select("id, status, started_at")
    .eq("business_id", business.id)
    .or(`status.eq.running,started_at.gte.${cooldownIso}`)
    .limit(1);
  if (recent && recent.length > 0) redirect(`/business/discover?error=cooldown${qParam}`);

  const { data: wallet } = await sb
    .from("wallets")
    .select("credits")
    .eq("user_id", session.userId)
    .maybeSingle();
  const credits = Number(wallet?.credits ?? 0);
  if (credits < cost) redirect(`/business/discover?error=credits${qParam}`);

  const scanId = randomUUID();
  const newBalance = Math.round((credits - cost) * 100) / 100;
  await sb.from("wallets").update({ credits: newBalance }).eq("user_id", session.userId);
  await sb.from("wallet_transactions").insert({
    user_id: session.userId,
    delta: -cost,
    reason: "scan",
    reference: `scan_${scanId}`,
    metadata: { business_id: business.id, scan_id: scanId, q: q || null },
  });

  const { error: scanErr } = await sb.from("discovered_scans").insert({
    id: scanId,
    business_id: business.id,
    status: "running",
    credits_spent: cost,
    query: { q: q || null },
  });
  if (scanErr) {
    await refund(sb, session.userId, cost, scanId, "insert_failed");
    redirect(`/business/discover?error=server${qParam}`);
  }

  try {
    await withTimeout(runScanInline(business.id, scanId, q), SCAN_BUDGET_MS, "scan");
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "unknown").slice(0, 500);
    console.error("[discover] scan failed:", msg);
    await refund(sb, session.userId, cost, scanId, "failed");
    await sb
      .from("discovered_scans")
      .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
      .eq("id", scanId);
    revalidatePath("/business/discover");
    redirect(`/business/discover?error=failed${qParam}`);
  }

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
