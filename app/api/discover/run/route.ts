import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { buildQueries, type BusinessProfile } from "@/lib/discover/queries";
import { searchMany, domainOf } from "@/lib/discover/search";
import { extractLeads } from "@/lib/discover/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let scanId = "";
  try {
    const body = await req.json();
    scanId = String(body?.scan_id ?? "");
  } catch {}
  if (!scanId) return NextResponse.json({ ok: false, error: "scan_id required" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: scan } = await sb
    .from("discovered_scans")
    .select("id, business_id, status, credits_spent")
    .eq("id", scanId)
    .maybeSingle();
  if (!scan) return NextResponse.json({ ok: false, error: "scan not found" }, { status: 404 });
  if (scan.status !== "running") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    // Load business profile.
    const [bizRes, catsRes, locsRes, budgetsRes] = await Promise.all([
      sb.from("businesses").select("id, user_id, bio, business_name").eq("id", scan.business_id).maybeSingle(),
      sb
        .from("business_categories")
        .select("category_id, categories(name)")
        .eq("business_id", scan.business_id),
      sb.from("business_locations").select("location").eq("business_id", scan.business_id),
      sb.from("business_budget_ranges").select("budget_min, budget_max").eq("business_id", scan.business_id),
    ]);
    const biz = bizRes.data as any;
    if (!biz) throw new Error("business missing");

    const profile: BusinessProfile = {
      industries: (catsRes.data ?? [])
        .map((c: any) => c.categories?.name)
        .filter(Boolean) as string[],
      locations: (locsRes.data ?? []).map((l: any) => l.location).filter(Boolean),
      budgets: (budgetsRes.data ?? []).map((b: any) => ({
        min: Number(b.budget_min) || 0,
        max: Number(b.budget_max) || 0,
      })),
      bio: biz.bio ?? null,
    };

    const queries = buildQueries(profile);
    const hits = await searchMany(queries);
    const leads = await extractLeads(profile, hits);

    let inserted = 0;
    for (const lead of leads) {
      const { error } = await sb.from("discovered_leads").insert({
        business_id: scan.business_id,
        scan_id: scan.id,
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
      // Unique conflict on (business_id, source_url) is fine — already seen.
    }

    await sb
      .from("discovered_scans")
      .update({
        status: "completed",
        results_count: inserted,
        query: { queries, hit_count: hits.length },
        finished_at: new Date().toISOString(),
      })
      .eq("id", scan.id);

    return NextResponse.json({ ok: true, inserted, queries: queries.length, hits: hits.length });
  } catch (e: any) {
    const message = String(e?.message ?? e ?? "unknown").slice(0, 500);
    console.error("[discover/run] failed:", message);

    // Refund credits and mark the scan failed.
    const cost = Number(scan.credits_spent) || 0;
    if (cost > 0) {
      const { data: biz } = await sb
        .from("businesses")
        .select("user_id")
        .eq("id", scan.business_id)
        .maybeSingle();
      const userId = (biz as any)?.user_id;
      if (userId) {
        const { data: w } = await sb.from("wallets").select("credits").eq("user_id", userId).maybeSingle();
        const current = Number(w?.credits ?? 0);
        await sb.from("wallets").update({ credits: current + cost }).eq("user_id", userId);
        await sb.from("wallet_transactions").insert({
          user_id: userId,
          delta: cost,
          reason: "refund",
          reference: `scan_refund_${scan.id}`,
          metadata: { scan_id: scan.id, reason: "scan_failed" },
        });
      }
    }

    await sb
      .from("discovered_scans")
      .update({ status: "failed", error: message, finished_at: new Date().toISOString() })
      .eq("id", scan.id);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
