import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCredits } from "@/lib/leads";
import { dismissDiscoveredLeadAction, revealDiscoveredLeadAction, sweepStaleScans } from "./actions";
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
  await sweepStaleScans(business.id);

  // A landing-page search before sign-in leaves a pending query cookie.
  // Read it (read-only — cookies can't be mutated during render) and use it
  // to pre-fill the box. It's cleared by the scan action once a scan runs.
  const pending = cookies().get("pending_search")?.value ?? "";
  const q = (searchParams.q ?? pending ?? "").slice(0, 240);

  const [settings, walletRes, leadsRes, scansRes] = await Promise.all([
    getSettings(),
    sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle(),
    sb
      .from("discovered_leads")
      .select("id, title, summary, source_url, source_domain, location, budget_hint, contact_hint, posted_at, score, created_at, revealed_at")
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
  const revealCost = Math.max(0, Number(settings.discover_reveal_cost_credits) || 0);
  const leads = leadsRes.data ?? [];
  const scans = scansRes.data ?? [];

  const errMap: Record<string, string> = {
    credits: "Not enough credits to reveal that lead. Top up your wallet.",
    cooldown: "Hang on — wait a moment before searching again.",
    server: "Couldn't start that search. Please try again.",
    failed: "That search failed. Try a different query.",
  };
  const errMsg = searchParams.error ? errMap[searchParams.error] : null;

  return (
    <div className="min-h-[80vh]">
      {/* Google-style centered search */}
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-10 sm:pt-16">
        <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Discover
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Describe a lead in plain English. We search the public web for matches — free.
        </p>

        <DiscoverSearchBox defaultQuery={q} suggestions={SUGGESTIONS} />

        <p className="mt-3 text-xs text-slate-500">
          Searching is free. Revealing a lead's source &amp; contact costs{" "}
          <strong>{formatCredits(revealCost)} credits</strong>. You have{" "}
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
              <strong>Search</strong>.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {leads.map((l: any) => {
              const revealed = !!l.revealed_at;
              return (
                <li key={l.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/30 hover:shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {revealed ? (
                        <a
                          href={l.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-base font-semibold leading-snug text-brand hover:underline"
                        >
                          {l.title}
                        </a>
                      ) : (
                        <p className="text-base font-semibold leading-snug text-slate-900">{l.title}</p>
                      )}
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
                    <span className="ml-auto">{formatRelative(l.created_at)}</span>
                  </div>

                  {/* Source + contact: locked until revealed */}
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    {revealed ? (
                      <div className="space-y-1 text-sm">
                        <p className="text-slate-700">
                          <span className="font-medium text-slate-500">Source: </span>
                          <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                            {l.source_domain || l.source_url}
                          </a>
                        </p>
                        {l.contact_hint && (
                          <p className="text-slate-700">
                            <span className="font-medium text-slate-500">Contact: </span>
                            {l.contact_hint}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="select-none blur-sm text-sm text-slate-600">
                            {l.source_domain ? `${l.source_domain.slice(0, 2)}••••••.com` : "••••••.com"} · contact hidden
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">Source &amp; contact locked</p>
                        </div>
                        <form action={revealDiscoveredLeadAction} className="shrink-0">
                          <input type="hidden" name="id" value={l.id} />
                          <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                            Reveal · {formatCredits(revealCost)} cr
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-right">
                    <form action={dismissDiscoveredLeadAction} className="inline">
                      <input type="hidden" name="id" value={l.id} />
                      <button className="text-[11px] text-slate-400 hover:text-slate-700">Dismiss</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {scans.length > 0 && (
          <details className="mt-10 rounded-xl border border-slate-200 bg-white/60 p-4 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Recent searches</summary>
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
