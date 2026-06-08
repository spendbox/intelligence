import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCredits } from "@/lib/leads";
import { dismissDiscoveredLeadAction, sweepStaleScans } from "./actions";
import DiscoverSearchBox from "./SearchBox";

export const dynamic = "force-dynamic";
// Server actions on this route can run an inline scan that talks to Tavily
// and OpenAI; give them up to 90s.
export const maxDuration = 90;

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

const SUGGESTIONS = [
  "Wedding photographer in Lagos under ₦500k",
  "3-bedroom apartment rental in Lekki Phase 1",
  "Catering for 80 corporate lunch in Abuja",
  "Custom CRM build for fintech sales team",
  "Bulk poultry feed supply in Ogun",
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { scan?: string; error?: string; q?: string };
}) {
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

  // Auto-recover any stuck scans before we render guard state.
  await sweepStaleScans(business.id, session.userId);

  // Honour a search query the user entered on the landing page before signing in.
  const cookieStore = cookies();
  const pendingCookie = cookieStore.get("pending_search")?.value;
  if (!searchParams.q && pendingCookie) {
    cookieStore.delete("pending_search");
    redirect(`/business/discover?q=${encodeURIComponent(pendingCookie)}`);
  }

  const [settings, walletRes, leadsRes, scansRes] = await Promise.all([
    getSettings(),
    sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle(),
    sb
      .from("discovered_leads")
      .select("id, title, summary, source_url, source_domain, location, budget_hint, contact_hint, posted_at, score, created_at")
      .eq("business_id", business.id)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(40),
    sb
      .from("discovered_scans")
      .select("id, status, results_count, error, started_at, finished_at")
      .eq("business_id", business.id)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const credits = Number(walletRes.data?.credits ?? 0);
  const cost = Math.max(0, Number(settings.discover_scan_cost_credits) || 0);
  const leads = leadsRes.data ?? [];
  const scans = scansRes.data ?? [];
  const lowCredits = credits < cost;
  const q = (searchParams.q ?? "").slice(0, 240);

  const errMap: Record<string, string> = {
    credits: "Not enough credits. Top up your wallet to scan again.",
    cooldown: "Hang on — wait a moment before another scan.",
    server: "Couldn't start that scan. Please try again.",
    failed: "That scan failed (we refunded your credits). Try a different query.",
  };
  const errMsg = searchParams.error ? errMap[searchParams.error] : null;

  return (
    <div className="min-h-[80vh]">
      {/* Google-style centered search */}
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-10 sm:pt-16">
        <h1 className="bg-gradient-to-r from-brand via-fuchsia-500 to-rose-400 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Discover
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Describe a lead in plain English. We scan the public web for matches.
        </p>

        <DiscoverSearchBox
          defaultQuery={q}
          cost={cost}
          credits={credits}
          disabled={lowCredits}
          suggestions={SUGGESTIONS}
        />

        <p className="mt-3 text-xs text-slate-500">
          Each scan costs <strong>{formatCredits(cost)} credits</strong>. You have{" "}
          <strong>{formatCredits(credits)}</strong>.
        </p>

        {errMsg && (
          <p className="mt-4 w-full rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
            {errMsg}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="mx-auto mt-10 max-w-3xl px-4 pb-16">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
            <p className="text-sm text-slate-600">
              No discovered leads yet. Type what you're looking for and tap{" "}
              <strong>Scan the web</strong>.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {leads.map((l: any) => (
              <li key={l.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-slate-500">{l.source_domain || "source"}</p>
                    <a
                      href={l.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block text-base font-semibold leading-snug text-brand hover:underline"
                    >
                      {l.title}
                    </a>
                  </div>
                  {typeof l.score === "number" && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {Math.round(Number(l.score) * 100)}%
                    </span>
                  )}
                </div>
                {l.summary && <p className="mt-2 text-sm text-slate-700">{l.summary}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  {l.location && <span>📍 {l.location}</span>}
                  {l.budget_hint && <span>· 💰 {l.budget_hint}</span>}
                  {l.contact_hint && <span>· ✉ {l.contact_hint}</span>}
                  <span className="ml-auto">{formatRelative(l.created_at)}</span>
                  <form action={dismissDiscoveredLeadAction} className="ml-2">
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-slate-400 hover:text-slate-700">Dismiss</button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}

        {scans.length > 0 && (
          <details className="mt-10 rounded-xl border border-slate-200 bg-white/60 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Recent scans</summary>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
              {scans.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="capitalize">{s.status}</span>
                  <span>{s.results_count ?? 0} results</span>
                  <span className="text-slate-400">{formatRelative(s.started_at)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
