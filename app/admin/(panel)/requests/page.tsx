import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange, formatNaira } from "@/lib/leads";
import { deleteRequestAction } from "./actions";
import ConfirmForm from "@/components/ConfirmForm";

async function RevenueStrip() {
  const sb = supabaseAdmin();
  // Paystack top-ups: wallet_transactions where reason=topup AND metadata.source = 'paystack'.
  // Admin manual credits are excluded — they don't count as revenue.
  const { data: txs } = await sb
    .from("wallet_transactions")
    .select("naira_amount, created_at, metadata")
    .eq("reason", "topup")
    .not("naira_amount", "is", null);
  const paystackTxs = (txs ?? []).filter(
    (t: any) => t.metadata && t.metadata.source === "paystack"
  );
  const totalTopup = paystackTxs.reduce((sum: number, t: any) => sum + (Number(t.naira_amount) || 0), 0);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = paystackTxs
    .filter((t: any) => new Date(t.created_at).getTime() >= thirtyDaysAgo)
    .reduce((sum: number, t: any) => sum + (Number(t.naira_amount) || 0), 0);

  // Priority payments: lead_requests with priority_paid=true.
  const { data: priorityRows } = await sb
    .from("lead_requests")
    .select("priority_amount_naira, priority_paid_at")
    .eq("priority_paid", true);
  const priorityTotal = (priorityRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.priority_amount_naira) || 0),
    0
  );
  const priority30 = (priorityRows ?? [])
    .filter((r: any) => r.priority_paid_at && new Date(r.priority_paid_at).getTime() >= thirtyDaysAgo)
    .reduce((sum: number, r: any) => sum + (Number(r.priority_amount_naira) || 0), 0);

  const grand = totalTopup + priorityTotal;
  const grand30 = last30 + priority30;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <RevCard label="Revenue (all time)" value={formatNaira(grand)} hint="Paystack only" />
      <RevCard label="Last 30 days" value={formatNaira(grand30)} hint="Top-ups + priority" />
      <RevCard label="Priority fees" value={formatNaira(priorityTotal)} hint={`${(priorityRows ?? []).length} paid`} />
    </div>
  );
}

function RevCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 2) return "1 minute ago";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 2) return "1 hour ago";
  if (h < 24) return `${h} hours ago`;
  const d = Math.round(h / 24);
  if (d < 2) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return mo === 1 ? "1 month ago" : `${mo} months ago`;
  const y = Math.round(mo / 12);
  return y === 1 ? "1 year ago" : `${y} years ago`;
}

function formatExact(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

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

export default async function AdminRequestsPage({ searchParams }: { searchParams: { status?: string; ok?: string } }) {
  const sb = supabaseAdmin();
  const status = (searchParams.status ?? "submitted") as string;
  let q = sb
    .from("lead_requests")
    .select("id, name, location, description, budget_min, budget_max, status, is_priority, priority_paid, unlocks_count, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") q = q.eq("status", status);
  const { data: requests } = await q;

  const { count: pending } = await sb.from("lead_requests").select("*", { count: "exact", head: true }).eq("status", "submitted");
  const { count: approved } = await sb.from("lead_requests").select("*", { count: "exact", head: true }).eq("status", "approved");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            {pending ?? 0} awaiting review · {approved ?? 0} live
          </p>
        </div>
        <Link
          href="/admin/requests/new"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          + New request
        </Link>
      </div>

      <RevenueStrip />

      {searchParams.ok === "deleted" && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">Request deleted.</p>
      )}

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

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Client</th>
              <th className="px-4 py-2.5">Industry</th>
              <th className="px-4 py-2.5">Budget</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Unlocks</th>
              <th className="px-4 py-2.5">Received</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{r.name}</span>
                    {r.is_priority && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                        🔥
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{r.categories?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.location}</td>
                <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                <td className="px-4 py-2.5 text-slate-600">{r.unlocks_count} / 10</td>
                <td className="px-4 py-2.5 text-slate-600">
                  <span title={formatExact(r.created_at)}>{formatRelative(r.created_at)}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/requests/${r.id}`} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Open
                    </Link>
                    <ConfirmForm
                      action={deleteRequestAction}
                      hidden={[{ name: "id", value: r.id }]}
                      trigger={{
                        label: "Delete",
                        className: "rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50",
                      }}
                      title="Delete this request?"
                      message={`Permanently delete "${r.name}'s" request and any matches, unlocks and images. Can't be undone.`}
                      confirmLabel="Delete request"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {(!requests || requests.length === 0) && (
              <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={8}>No requests in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
