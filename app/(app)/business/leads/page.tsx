import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function BusinessLeadsPage({
  searchParams,
}: {
  searchParams: { tab?: string; category?: string; location?: string };
}) {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb
    .from("businesses")
    .select("id, setup_complete")
    .eq("user_id", session.userId!)
    .maybeSingle();
  if (!business || !business.setup_complete) redirect("/business/setup");

  const tab = (searchParams.tab ?? "matched") as "matched" | "all";
  const categoryFilter = searchParams.category ?? "";
  const locationFilter = (searchParams.location ?? "").trim().toLowerCase();

  // Matched request IDs (still used to badge "Matched" on every card)
  const { data: notifs } = await sb
    .from("lead_notifications")
    .select("request_id")
    .eq("business_id", business.id);
  const matchedIds = new Set((notifs ?? []).map((n) => n.request_id));

  // Build the request list depending on tab
  let q = sb
    .from("lead_requests")
    .select("id, location, status, budget_min, budget_max, unlock_credits, unlocks_count, unlocks_cap, description, created_at, category_id, categories(name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  if (tab === "matched" && matchedIds.size === 0) {
    // No matched: bail with empty result
    q = q.eq("id", "00000000-0000-0000-0000-000000000000");
  } else if (tab === "matched") {
    q = q.in("id", Array.from(matchedIds));
  }
  if (categoryFilter) q = q.eq("category_id", categoryFilter);
  const { data: requests } = await q;

  const filtered = (requests ?? []).filter((r: any) => {
    if (!locationFilter) return true;
    return String(r.location ?? "").toLowerCase().includes(locationFilter);
  });

  const { data: unlocks } = await sb
    .from("lead_unlocks")
    .select("request_id")
    .eq("business_id", business.id);
  const unlocked = new Set((unlocks ?? []).map((u) => u.request_id));

  const { data: categories } = await sb.from("categories").select("id, name").eq("active", true).order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your leads</h1>
        <p className="mt-1 text-sm text-slate-600">
          You receive email alerts for leads matched to you. You can browse and unlock any open request.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { k: "matched", label: `Matched (${matchedIds.size})` },
          { k: "all", label: "All open" },
        ].map((t) => (
          <Link
            key={t.k}
            href={{ pathname: "/business/leads", query: { tab: t.k, category: categoryFilter || undefined, location: searchParams.location || undefined } }}
            className={
              "rounded-full px-3 py-1 text-xs font-medium " +
              (tab === t.k ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input type="hidden" name="tab" value={tab} />
        <select
          name="category"
          defaultValue={categoryFilter}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All industries</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          name="location"
          defaultValue={searchParams.location ?? ""}
          placeholder="Filter by location"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Apply filters
        </button>
      </form>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No leads to show. Try the "All open" tab or change filters.
          </div>
        )}
        {filtered.map((r: any) => {
          const isUnlocked = unlocked.has(r.id);
          const isMatched = matchedIds.has(r.id);
          const capReached = r.unlocks_count >= r.unlocks_cap;
          return (
            <Link
              key={r.id}
              href={`/business/leads/${r.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">{r.categories?.name ?? "Lead"}</p>
                  <p className="mt-1 text-base font-semibold">{r.location}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {isMatched && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Matched</span>
                  )}
                  {isUnlocked ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Unlocked</span>
                  ) : capReached ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Closed</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {r.unlock_credits} credits to unlock
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-700">{r.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Posted {new Date(r.created_at).toLocaleString()} · {r.unlocks_count}/{r.unlocks_cap} unlocked
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
