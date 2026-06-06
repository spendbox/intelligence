import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

function formatStatus(status: string, subActive: boolean) {
  if (status === "trialing") return "Free Trial";
  if (status === "active" || subActive) return "Active";
  if (status === "canceled") return "Canceled";
  return status;
}

export default async function DashboardPage() {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: user } = await sb
    .from("users")
    .select("email, status, trial_ends_at, subscription_ends_at, subscription_plan")
    .eq("id", session.userId!)
    .single();

  const { count: categoryCount } = await sb
    .from("user_categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.userId!);

  const { data: deliveries } = await sb
    .from("email_deliveries")
    .select("id, created_at, status, insight_drafts(id, subject, sent_at, categories(name))")
    .eq("user_id", session.userId!)
    .order("created_at", { ascending: false })
    .limit(10);

  const subActive = !!user?.subscription_ends_at && new Date(user.subscription_ends_at) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</p>
          <p className="mt-1 text-lg font-semibold">{formatStatus(user?.status ?? "", subActive)}</p>
          {user?.status === "trialing" && user?.trial_ends_at && (
            <p className="mt-1 text-sm text-slate-600">
              Trial ends {new Date(user.trial_ends_at).toLocaleDateString()}
            </p>
          )}
          {subActive && (
            <p className="mt-1 text-sm text-slate-600">
              {user?.subscription_plan === "yearly" ? "Yearly" : "Monthly"} · renews{" "}
              {new Date(user!.subscription_ends_at!).toLocaleDateString()}
            </p>
          )}
          <Link href="/subscription" className="mt-3 inline-block text-sm font-medium text-brand">
            Manage plan →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected categories</p>
          <p className="mt-1 text-lg font-semibold">{categoryCount ?? 0}</p>
          <Link href="/categories" className="mt-3 inline-block text-sm font-medium text-brand">
            Change categories →
          </Link>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent insights</h2>
          <span className="text-xs text-slate-500">Last 10</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {(deliveries ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              No insights yet. Up to 10 actionable insights are sent every month based on your selected categories.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(deliveries ?? []).map((d: any) => (
                <li key={d.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.insight_drafts?.subject ?? "Insight"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.insight_drafts?.categories?.name ?? "—"} ·{" "}
                      {new Date(d.insight_drafts?.sent_at ?? d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
