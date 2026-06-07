import { supabaseAdmin } from "@/lib/supabase/server";
import { manualCreditAction } from "./actions";

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

export default async function AdminUsersPage({ searchParams }: { searchParams: { credited?: string; error?: string } }) {
  const sb = supabaseAdmin();
  const { data: users } = await sb
    .from("users")
    .select("id, email, status, trial_ends_at, subscription_ends_at, subscription_plan, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: wallets } = await sb.from("wallets").select("user_id, credits");
  const creditsByUser = (wallets ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.user_id] = r.credits;
    return acc;
  }, {});

  const { data: bizes } = await sb.from("businesses").select("user_id, business_name");
  const bizByUser = (bizes ?? []).reduce<Record<string, string>>((acc, r) => {
    acc[r.user_id] = r.business_name ?? "";
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-slate-600">{users?.length ?? 0} users</p>
      </div>

      {searchParams.credited && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Credited {searchParams.credited} credits.
        </p>
      )}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Could not credit. Check inputs.</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Email / Business</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Credits</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5">Manual credit (₦)</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60 align-top">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{u.email}</p>
                  {bizByUser[u.id] && <p className="text-xs text-slate-500">{bizByUser[u.id]}</p>}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}>
                    {statusLabel(u.status)}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-semibold text-brand">{(creditsByUser[u.id] ?? 0).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <form action={manualCreditAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="user_id" value={u.id} />
                    <input
                      name="naira"
                      type="number"
                      min={1}
                      placeholder="₦"
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      name="note"
                      placeholder="note"
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark">
                      Credit
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
