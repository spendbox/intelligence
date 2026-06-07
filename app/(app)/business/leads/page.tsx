import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function BusinessLeadsPage() {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb.from("businesses").select("id, setup_complete").eq("user_id", session.userId!).maybeSingle();
  if (!business || !business.setup_complete) redirect("/business/setup");

  const { data: notifs } = await sb
    .from("lead_notifications")
    .select("sent_at, lead_requests(id, location, status, budget_min, budget_max, unlock_credits, unlocks_count, unlocks_cap, description, categories(name))")
    .eq("business_id", business.id)
    .order("sent_at", { ascending: false })
    .limit(100);

  const { data: unlocks } = await sb
    .from("lead_unlocks")
    .select("request_id")
    .eq("business_id", business.id);
  const unlocked = new Set((unlocks ?? []).map((u) => u.request_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your leads</h1>
        <p className="mt-1 text-sm text-slate-600">All requests matched to your industries, locations and budget ranges.</p>
      </div>

      <div className="space-y-3">
        {(notifs ?? []).length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No leads yet. Top up to 500+ credits and they'll start landing here.
          </div>
        )}
        {(notifs ?? []).map((n: any) => {
          const r = n.lead_requests;
          if (!r) return null;
          const isUnlocked = unlocked.has(r.id);
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
                <div className="text-right">
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
              <p className="mt-2 text-xs text-slate-400">{new Date(n.sent_at).toLocaleString()} · {r.unlocks_count}/{r.unlocks_cap} unlocked</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
