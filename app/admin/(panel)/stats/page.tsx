import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange, formatNaira, formatCredits } from "@/lib/leads";

export const dynamic = "force-dynamic";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(h < 10 ? 1 : 0)}h`;
  const d = h / 24;
  return `${d.toFixed(d < 10 ? 1 : 0)}d`;
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

export default async function AdminStatsPage() {
  const sb = supabaseAdmin();

  const [
    { data: categories },
    { data: businesses },
    { data: bizCats },
    { data: requests },
    { data: unlocks },
    { data: notifications },
  ] = await Promise.all([
    sb.from("categories").select("id, name, slug, active"),
    sb.from("businesses").select("id, business_name, display_name, setup_complete, created_at, users(email)"),
    sb.from("business_categories").select("business_id, category_id"),
    sb.from("lead_requests").select("id, name, category_id, budget_min, budget_max, status, created_at"),
    sb.from("lead_unlocks").select("id, request_id, business_id, user_id, credits_spent, created_at"),
    sb.from("lead_notifications").select("request_id, business_id, sent_at, email_sent"),
  ]);

  const cats = categories ?? [];
  const biz = businesses ?? [];
  const bcs = bizCats ?? [];
  const reqs = requests ?? [];
  const unls = unlocks ?? [];
  const nots = notifications ?? [];

  // Lookup maps
  const catById = new Map(cats.map((c: any) => [c.id, c]));
  const bizById = new Map(biz.map((b: any) => [b.id, b]));
  const reqById = new Map(reqs.map((r: any) => [r.id, r]));
  // notification key: request_id|business_id -> sent_at (only when email_sent)
  const notSentAt = new Map<string, string>();
  for (const n of nots as any[]) {
    if (!n.email_sent) continue;
    notSentAt.set(`${n.request_id}|${n.business_id}`, n.sent_at);
  }
  // business -> [category_ids]
  const bizCategories = new Map<string, string[]>();
  for (const bc of bcs as any[]) {
    const arr = bizCategories.get(bc.business_id) ?? [];
    arr.push(bc.category_id);
    bizCategories.set(bc.business_id, arr);
  }

  // Per-industry stats
  type IndustryStat = {
    id: string;
    name: string;
    businesses: number;
    requests: number;
    reveals: number;
    creditsSpent: number;
    budgets: { min: number; max: number }[];
  };
  const indMap = new Map<string, IndustryStat>();
  for (const c of cats as any[]) {
    indMap.set(c.id, { id: c.id, name: c.name, businesses: 0, requests: 0, reveals: 0, creditsSpent: 0, budgets: [] });
  }
  for (const [, catIds] of bizCategories) {
    for (const id of catIds) {
      const s = indMap.get(id);
      if (s) s.businesses++;
    }
  }
  for (const r of reqs as any[]) {
    if (!r.category_id) continue;
    const s = indMap.get(r.category_id);
    if (!s) continue;
    s.requests++;
    s.budgets.push({ min: Number(r.budget_min) || 0, max: Number(r.budget_max) || 0 });
  }
  for (const u of unls as any[]) {
    const r = reqById.get(u.request_id) as any;
    if (!r?.category_id) continue;
    const s = indMap.get(r.category_id);
    if (!s) continue;
    s.reveals++;
    s.creditsSpent += Number(u.credits_spent) || 0;
  }

  const industryRows = Array.from(indMap.values()).sort((a, b) => b.businesses - a.businesses);

  // KPIs
  const setupBiz = biz.filter((b: any) => b.setup_complete).length;
  const totalReveals = unls.length;
  const totalCreditsSpent = unls.reduce((sum: number, u: any) => sum + (Number(u.credits_spent) || 0), 0);
  const totalRequests = reqs.length;
  const approvedReqs = reqs.filter((r: any) => r.status === "approved").length;

  // Average time-to-reveal: notification sent_at -> unlock created_at
  const ttRevealMs: number[] = [];
  for (const u of unls as any[]) {
    const sent = notSentAt.get(`${u.request_id}|${u.business_id}`);
    if (!sent) continue;
    const delta = new Date(u.created_at).getTime() - new Date(sent).getTime();
    if (Number.isFinite(delta) && delta > 0) ttRevealMs.push(delta);
  }
  const avgRevealMs = ttRevealMs.length ? ttRevealMs.reduce((a, b) => a + b, 0) / ttRevealMs.length : 0;
  const medianRevealMs = median(ttRevealMs);

  // Recent reveals (most recent 50)
  const recent = (unls as any[])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map((u) => {
      const r = reqById.get(u.request_id) as any;
      const b = bizById.get(u.business_id) as any;
      const cat = r?.category_id ? (catById.get(r.category_id) as any) : null;
      const sent = notSentAt.get(`${u.request_id}|${u.business_id}`);
      const ttr = sent ? new Date(u.created_at).getTime() - new Date(sent).getTime() : null;
      return {
        id: u.id,
        requestId: u.request_id,
        requestName: (r as any)?.name ?? "Request",
        industry: cat?.name ?? "—",
        businessName: b?.business_name || b?.display_name || b?.users?.email || "Unknown",
        credits: Number(u.credits_spent) || 0,
        createdAt: u.created_at,
        ttrMs: ttr,
      };
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
        <p className="mt-1 text-sm text-slate-600">Marketplace activity across industries and reveals.</p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Industries" value={String(cats.filter((c: any) => c.active).length)} hint={`${cats.length} total`} />
        <Kpi label="Businesses" value={setupBiz.toLocaleString()} hint={`${biz.length} signed up`} />
        <Kpi label="Requests" value={totalRequests.toLocaleString()} hint={`${approvedReqs} approved`} />
        <Kpi label="Reveals" value={totalReveals.toLocaleString()} hint="contacts unlocked" />
        <Kpi label="Credits spent" value={formatCredits(totalCreditsSpent)} hint="on reveals" />
        <Kpi label="Avg time to reveal" value={formatDuration(avgRevealMs)} hint={`median ${formatDuration(medianRevealMs)}`} />
        <Kpi label="Reveals / request" value={totalRequests ? (totalReveals / totalRequests).toFixed(2) : "0"} hint="across all requests" />
        <Kpi label="Avg credits / reveal" value={totalReveals ? formatCredits(Math.round((totalCreditsSpent / totalReveals) * 100) / 100) : "0"} hint="business spend" />
      </div>

      {/* Industries breakdown */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Industries breakdown</h2>
        <p className="mt-0.5 text-xs text-slate-500">Businesses, requests, reveals and preferred price range per industry.</p>

        {/* Mobile: cards */}
        <div className="mt-3 grid gap-3 md:hidden">
          {industryRows.map((r) => {
            const mids = r.budgets.map((b) => Math.round((b.min + b.max) / 2));
            const medMid = median(mids);
            const medMin = median(r.budgets.map((b) => b.min));
            const medMax = median(r.budgets.map((b) => b.max));
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold">{r.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-slate-600">
                  <span>Businesses</span><span className="text-right font-medium text-slate-900">{r.businesses}</span>
                  <span>Requests</span><span className="text-right font-medium text-slate-900">{r.requests}</span>
                  <span>Reveals</span><span className="text-right font-medium text-slate-900">{r.reveals}</span>
                  <span>Credits spent</span><span className="text-right font-medium text-slate-900">{formatCredits(r.creditsSpent)}</span>
                  <span>Median budget</span><span className="text-right font-medium text-slate-900">{r.budgets.length ? formatNaira(medMid) : "—"}</span>
                  <span>Preferred range</span><span className="text-right font-medium text-slate-900">{r.budgets.length ? formatBudgetRange(medMin, medMax) : "—"}</span>
                </div>
              </div>
            );
          })}
          {industryRows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No industries yet.</p>
          )}
        </div>

        {/* Desktop: table */}
        <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2 text-right">Businesses</th>
                <th className="px-4 py-2 text-right">Requests</th>
                <th className="px-4 py-2 text-right">Reveals</th>
                <th className="px-4 py-2 text-right">Credits spent</th>
                <th className="px-4 py-2 text-right">Median budget</th>
                <th className="px-4 py-2">Preferred range</th>
              </tr>
            </thead>
            <tbody>
              {industryRows.map((r) => {
                const medMin = median(r.budgets.map((b) => b.min));
                const medMax = median(r.budgets.map((b) => b.max));
                const medMid = median(r.budgets.map((b) => Math.round((b.min + b.max) / 2)));
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2 text-right">{r.businesses}</td>
                    <td className="px-4 py-2 text-right">{r.requests}</td>
                    <td className="px-4 py-2 text-right">{r.reveals}</td>
                    <td className="px-4 py-2 text-right">{formatCredits(r.creditsSpent)}</td>
                    <td className="px-4 py-2 text-right">{r.budgets.length ? formatNaira(medMid) : "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{r.budgets.length ? formatBudgetRange(medMin, medMax) : "—"}</td>
                  </tr>
                );
              })}
              {industryRows.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={7}>No industries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent reveals */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent reveals</h2>
        <p className="mt-0.5 text-xs text-slate-500">Most recent 50 contact unlocks.</p>

        {/* Mobile: cards */}
        <div className="mt-3 grid gap-3 md:hidden">
          {recent.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.businessName}</p>
                  <p className="truncate text-xs text-slate-500">{r.industry}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  {formatCredits(r.credits)} cr
                </span>
              </div>
              <p className="mt-2 truncate text-sm text-slate-700">
                <Link href={`/admin/requests/${r.requestId}`} className="hover:underline">{r.requestName}</Link>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Time to reveal: {r.ttrMs != null ? formatDuration(r.ttrMs) : "—"}</span>
                <span>{formatRelative(r.createdAt)}</span>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No reveals yet.</p>
          )}
        </div>

        {/* Desktop: table */}
        <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Business</th>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2">Request</th>
                <th className="px-4 py-2 text-right">Credits</th>
                <th className="px-4 py-2 text-right">Time to reveal</th>
                <th className="px-4 py-2 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{r.businessName}</td>
                  <td className="px-4 py-2 text-slate-600">{r.industry}</td>
                  <td className="px-4 py-2 text-slate-600">
                    <Link href={`/admin/requests/${r.requestId}`} className="hover:underline">{r.requestName}</Link>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCredits(r.credits)}</td>
                  <td className="px-4 py-2 text-right">{r.ttrMs != null ? formatDuration(r.ttrMs) : "—"}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{formatRelative(r.createdAt)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>No reveals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
