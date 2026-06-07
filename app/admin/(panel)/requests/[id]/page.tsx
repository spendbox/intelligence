import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange } from "@/lib/leads";
import { approveRequestAction, rejectRequestAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; matched?: string } }) {
  const sb = supabaseAdmin();
  const { data: r } = await sb
    .from("lead_requests")
    .select("id, name, email, phone, description, status, budget_min, budget_max, location, unlock_credits, unlocks_count, unlocks_cap, created_at, approved_at, reject_reason, categories(name, id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) notFound();

  const { data: notifs } = await sb
    .from("lead_notifications")
    .select("business_id, sent_at, businesses(display_name, business_name, users(email))")
    .eq("request_id", r.id)
    .order("sent_at", { ascending: false });

  const { data: unlocks } = await sb
    .from("lead_unlocks")
    .select("created_at, credits_spent, businesses(display_name, business_name, users(email))")
    .eq("request_id", r.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request from {r.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{new Date(r.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/requests/${r.id}/preview`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Preview as business ↗
          </Link>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">{r.status}</span>
        </div>
      </div>

      {searchParams.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Approved · {searchParams.matched ?? 0} business{(searchParams.matched ?? "0") === "1" ? "" : "es"} notified.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Industry" value={(r as any).categories?.name ?? "—"} />
          <Row label="Budget" value={formatBudgetRange(r.budget_min, r.budget_max)} />
          <Row label="Location" value={r.location} />
          <Row label="Unlock cost" value={`${r.unlock_credits} credits`} />
          <Row label="Email" value={r.email} />
          <Row label="Phone" value={r.phone} />
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{r.description}</p>
        </div>
      </div>

      {r.status === "submitted" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={approveRequestAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={r.id} />
            <h2 className="text-sm font-semibold">Approve & notify</h2>
            <p className="mt-1 text-sm text-slate-600">Run matching and email matching businesses (credits ≥ 500).</p>
            <button className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Approve request
            </button>
          </form>
          <form action={rejectRequestAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={r.id} />
            <h2 className="text-sm font-semibold">Reject</h2>
            <input
              name="reason"
              placeholder="Reason (optional)"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="mt-3 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
              Reject request
            </button>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Notified businesses</h2>
        <p className="mt-1 text-xs text-slate-500">{notifs?.length ?? 0} businesses received this lead.</p>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(notifs ?? []).map((n: any, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>{n.businesses?.business_name || n.businesses?.display_name || n.businesses?.users?.email}</span>
              <span className="text-xs text-slate-500">{new Date(n.sent_at).toLocaleString()}</span>
            </li>
          ))}
          {(!notifs || notifs.length === 0) && <li className="py-2 text-slate-500">No businesses notified yet.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Unlocks ({r.unlocks_count} / {r.unlocks_cap})</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(unlocks ?? []).map((u: any, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>{u.businesses?.business_name || u.businesses?.display_name || u.businesses?.users?.email}</span>
              <span className="text-xs text-slate-500">{u.credits_spent} credits · {new Date(u.created_at).toLocaleString()}</span>
            </li>
          ))}
          {(!unlocks || unlocks.length === 0) && <li className="py-2 text-slate-500">No unlocks yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
