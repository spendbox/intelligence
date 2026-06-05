import { supabaseAdmin } from "@/lib/supabase/server";

export default async function AdminDeliveriesPage() {
  const sb = supabaseAdmin();
  const { data: deliveries } = await sb
    .from("email_deliveries")
    .select("id, status, error, created_at, updated_at, resend_message_id, users(email), insight_drafts(subject)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold">Deliveries</h1>
      <p className="mt-1 text-sm text-slate-600">Most recent 200 deliveries</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                <td className="px-4 py-2">{new Date(d.updated_at ?? d.created_at).toLocaleString()}</td>
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
    </div>
  );
}
