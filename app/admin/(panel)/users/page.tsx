import { supabaseAdmin } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const sb = supabaseAdmin();
  const { data: users } = await sb
    .from("users")
    .select("id, email, status, trial_ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: counts } = await sb.from("user_categories").select("user_id");
  const perUser = (counts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-slate-600">{users?.length ?? 0} users</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Trial ends</th>
              <th className="px-4 py-2">Categories</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.status}</td>
                <td className="px-4 py-2">{u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2">{perUser[u.id] ?? 0}</td>
                <td className="px-4 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
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
