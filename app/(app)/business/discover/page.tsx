import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatCredits } from "@/lib/leads";
import ConfirmForm from "@/components/ConfirmForm";
import { dismissDiscoveredLeadAction, runDiscoveryScanAction } from "./actions";

export const dynamic = "force-dynamic";

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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { scan?: string; error?: string };
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

  const [settings, walletRes, leadsRes, scansRes] = await Promise.all([
    getSettings(),
    sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle(),
    sb
      .from("discovered_leads")
      .select("id, title, summary, source_url, source_domain, location, budget_hint, contact_hint, posted_at, score, created_at")
      .eq("business_id", business.id)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(60),
    sb
      .from("discovered_scans")
      .select("id, status, results_count, error, started_at, finished_at")
      .eq("business_id", business.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const credits = Number(walletRes.data?.credits ?? 0);
  const cost = Math.max(0, Number(settings.discover_scan_cost_credits) || 0);
  const cooldownSec = Math.max(0, Number(settings.discover_scan_cooldown_seconds) || 0);
  const leads = leadsRes.data ?? [];
  const scans = scansRes.data ?? [];

  const activeScan = scans.find((s: any) => s.status === "running");
  const lastScan = scans[0];
  const lastStartedMs = lastScan ? new Date(lastScan.started_at).getTime() : 0;
  const cooldownLeftSec = lastStartedMs
    ? Math.max(0, Math.ceil((lastStartedMs + cooldownSec * 1000 - Date.now()) / 1000))
    : 0;
  const inCooldown = !!activeScan || cooldownLeftSec > 0;
  const lowCredits = credits < cost;
  const buttonDisabled = inCooldown || lowCredits;

  return (
    <>
      {activeScan && (
        // Auto-refresh while a scan is running so completed results show up
        // without the user reloading.
        // eslint-disable-next-line @next/next/no-head-element
        <meta httpEquiv="refresh" content="8" />
      )}

      <div className="space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand/[0.06] to-fuchsia-50 p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold tracking-tight">Discover leads on the web</h1>
              <p className="mt-1 text-sm text-slate-600">
                Scan publicly posted requests, jobs and callouts that match your industry, area and budget.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ConfirmForm
                action={runDiscoveryScanAction}
                trigger={{
                  label: buttonDisabled ? "Run a scan" : `Run a scan · ${formatCredits(cost)} cr`,
                  className:
                    "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition " +
                    (buttonDisabled
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-brand text-white hover:bg-brand-dark"),
                }}
                danger={false}
                title="Run a discovery scan?"
                message={
                  <>
                    This will search the web for opportunities matching your profile and
                    spend <strong>{formatCredits(cost)} credits</strong>. Takes about a minute.
                  </>
                }
                confirmLabel={buttonDisabled ? "Unavailable" : `Spend ${formatCredits(cost)} credits`}
              />
              <p className="text-xs text-slate-500">
                Wallet: <strong>{formatCredits(credits)}</strong> credits
              </p>
            </div>
          </div>

          {searchParams.error === "credits" && (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Not enough credits. <a href="/business/wallet" className="font-medium underline">Top up</a> to scan.
            </p>
          )}
          {searchParams.error === "cooldown" && (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You're scanning too often. Try again in a moment.
            </p>
          )}
          {searchParams.error === "server" && (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Couldn't start that scan. Please try again.
            </p>
          )}
          {activeScan && (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Scanning the web… results will appear here in under a minute.
            </p>
          )}
          {!activeScan && inCooldown && (
            <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
              Cooldown: try again in {cooldownLeftSec}s.
            </p>
          )}
        </header>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Results</h2>
          <p className="mt-0.5 text-xs text-slate-500">Most recent 60, lowest-quality matches filtered out.</p>

          {leads.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                No discovered leads yet. Tap <strong>Run a scan</strong> to see public opportunities that match your profile.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {leads.map((l: any) => (
                <article key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-brand">
                        {l.source_domain || "source"}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">{l.title}</h3>
                    </div>
                    {typeof l.score === "number" && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {Math.round(Number(l.score) * 100)}%
                      </span>
                    )}
                  </div>

                  {l.summary && <p className="mt-2 text-sm text-slate-600">{l.summary}</p>}

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    {l.location && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">📍 {l.location}</span>
                    )}
                    {l.budget_hint && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">💰 {l.budget_hint}</span>
                    )}
                    {l.contact_hint && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">✉ {l.contact_hint}</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                    <a
                      href={l.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800"
                    >
                      Open source ↗
                    </a>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>{formatRelative(l.created_at)}</span>
                      <form action={dismissDiscoveredLeadAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                          Dismiss
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Recent scans</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2 text-right">Results</th>
                  <th className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s: any) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-2"><StatusPill status={s.status} /></td>
                    <td className="px-4 py-2 text-slate-600">{formatRelative(s.started_at)}</td>
                    <td className="px-4 py-2 text-right">{s.results_count ?? 0}</td>
                    <td className="px-4 py-2 text-rose-600">{s.error ?? ""}</td>
                  </tr>
                ))}
                {scans.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                      No scans yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
