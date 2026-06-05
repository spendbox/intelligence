import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: user } = await sb
    .from("users")
    .select("email, status, trial_ends_at")
    .eq("id", session.userId!)
    .single();

  const { count: categoryCount } = await sb
    .from("user_categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.userId!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</p>
          <p className="mt-1 text-lg font-semibold capitalize">{user?.status}</p>
          {user?.status === "trialing" && user?.trial_ends_at && (
            <p className="mt-1 text-sm text-slate-600">
              Trial ends {new Date(user.trial_ends_at).toLocaleDateString()}
            </p>
          )}
          <Link href="/subscription" className="mt-3 inline-block text-sm font-medium text-brand">
            Manage subscription →
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

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">What's next</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick the categories you care about. We'll email curated insights based on your picks on the
          monthly schedule.
        </p>
      </div>
    </div>
  );
}
