import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange } from "@/lib/leads";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
    closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default async function AdminRequestsPage({ searchParams }: { searchParams: { status?: string } }) {
  const sb = supabaseAdmin();
  const status = (searchParams.status ?? "submitted") as string;
  let q = sb
    .from("lead_requests")
    .select("id, name, location, description, budget_min, budget_max, status, unlocks_count, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") q = q.eq("status", status);
  const { data: requests } = await q;

  const { count: pending } = await sb.from("lead_requests").select("*", { count: "exact", head: true }).eq("status", "submitted");
  const { count: approved } = await sb.from("lead_requests").select("*", { count: "exact", head: true }).eq("status", "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead requests</h1>
        <p className="mt-1 text-sm text-slate-600">
          {pending ?? 0} awaiting review · {approved ?? 0} live
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["submitted", "approved", "rejected", "all"].map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={
              "rounded-full px-3 py-1 text-xs font-medium capitalize " +
              (status === s ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
            }
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Client</th>
              <th className="px-4 py-2.5">Industry</th>
              <th className="px-4 py-2.5">Budget</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Unlocks</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.categories?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.location}</td>
                <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                <td className="px-4 py-2.5 text-slate-600">{r.unlocks_count} / 10</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/requests/${r.id}`} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={7}>No requests in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
