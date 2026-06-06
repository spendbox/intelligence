import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusLabel(s: string) {
  if (s === "trialing") return "Free Trial";
  if (s === "active") return "Active";
  if (s === "canceled") return "Canceled";
  return s;
}
function statusClass(s: string) {
  if (s === "trialing") return "bg-amber-50 text-amber-700";
  if (s === "active") return "bg-emerald-50 text-emerald-700";
  if (s === "canceled") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-600";
}

export default async function AdminUsersPage() {
  const sb = supabaseAdmin();
  const { data: users } = await sb
    .from("users")
    .select("id, email, status, trial_ends_at, subscription_ends_at, subscription_plan, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: counts } = await sb.from("user_categories").select("user_id");
  const perUser = (counts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-slate-600">{users?.length ?? 0} users</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Trial / Renews</th>
              <th className="px-4 py-2.5">Categories</th>
              <th className="px-4 py-2.5">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}>
                    {statusLabel(u.status)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {u.subscription_ends_at
                    ? `${u.subscription_plan ?? "—"} · ${new Date(u.subscription_ends_at).toLocaleDateString()}`
                    : u.trial_ends_at
                    ? new Date(u.trial_ends_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-2.5">{perUser[u.id] ?? 0}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
