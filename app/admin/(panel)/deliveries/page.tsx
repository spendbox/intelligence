import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatRelative(iso?: string | null): string {
  if (!iso) return "—";
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

function formatExact(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default async function AdminDeliveriesPage() {
  const sb = supabaseAdmin();

  const { data: leadEmails } = await sb
    .from("lead_notifications")
    .select("id, email_sent, sent_at, added_by, businesses(name, users(email)), lead_requests(id, name, categories(name))")
    .order("sent_at", { ascending: false })
    .limit(200);

  const { data: deliveries } = await sb
    .from("email_deliveries")
    .select("id, status, error, created_at, updated_at, resend_message_id, users(email), insight_drafts(subject)")
    .order("created_at", { ascending: false })
    .limit(200);

  const sentCount = (leadEmails ?? []).filter((n: any) => n.email_sent).length;
  const pendingCount = (leadEmails ?? []).filter((n: any) => !n.email_sent).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
        <p className="mt-1 text-sm text-slate-600">Lead emails and transactional sends.</p>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Lead request emails</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {sentCount} sent · {pendingCount} queued · most recent 200
            </p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Business email</th>
                <th className="px-4 py-2">Business</th>
                <th className="px-4 py-2">Request</th>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Sent</th>
                <th className="px-4 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {(leadEmails ?? []).map((n: any) => {
                const email = n.businesses?.users?.email ?? "—";
                const req = n.lead_requests;
                const sentClass = n.email_sent
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700";
                return (
                  <tr key={n.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{email}</td>
                    <td className="px-4 py-2 text-slate-600">{n.businesses?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {req ? (
                        <Link href={`/admin/requests/${req.id}`} className="hover:underline">
                          {req.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{req?.categories?.name ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sentClass}`}>
                        {n.email_sent ? "Sent" : "Queued"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {n.email_sent ? (
                        <span title={formatExact(n.sent_at)}>{formatRelative(n.sent_at)}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{n.added_by ?? "—"}</td>
                  </tr>
                );
              })}
              {(!leadEmails || leadEmails.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                    No lead emails yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Insight emails</h2>
        <p className="mt-0.5 text-xs text-slate-500">Most recent 200</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Recipient</th>
                <th className="px-4 py-2">Insight</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {(deliveries ?? []).map((d: any) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{d.users?.email}</td>
                  <td className="px-4 py-2">{d.insight_drafts?.subject}</td>
                  <td className="px-4 py-2 capitalize">{d.status}</td>
                  <td className="px-4 py-2" title={formatExact(d.updated_at ?? d.created_at)}>
                    {formatRelative(d.updated_at ?? d.created_at)}
                  </td>
                  <td className="px-4 py-2 text-rose-600">{d.error ?? ""}</td>
                </tr>
              ))}
              {(!deliveries || deliveries.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                    No deliveries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
