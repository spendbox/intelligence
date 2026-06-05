import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  scheduleDraftAction,
  sendDraftNowAction,
  updateDraftAction,
} from "../actions";

export default async function AdminInsightPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string; scheduled?: string; sent?: string };
}) {
  const sb = supabaseAdmin();
  const { data: draft } = await sb
    .from("insight_drafts")
    .select("id, subject, body_md, body_html, category_id, status, scheduled_for, sent_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!draft) notFound();

  const { data: categories } = await sb.from("categories").select("id, name").eq("active", true).order("name");
  const { data: deliveryStats } = await sb
    .from("email_deliveries")
    .select("status")
    .eq("insight_id", params.id);

  const counts = (deliveryStats ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const isSent = draft.status === "sent";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insight draft</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {draft.status}
        </span>
      </div>

      {searchParams.saved && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>}
      {searchParams.scheduled && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Scheduled.</p>}
      {searchParams.sent && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Sent.</p>}

      <form action={updateDraftAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <input type="hidden" name="id" value={draft.id} />
        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            name="category_id"
            defaultValue={draft.category_id}
            disabled={isSent}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Subject</label>
          <input
            name="subject"
            defaultValue={draft.subject}
            disabled={isSent}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Body (Markdown)</label>
          <textarea
            name="body_md"
            defaultValue={draft.body_md}
            disabled={isSent}
            rows={12}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        </div>
        <button disabled={isSent} className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          Save changes
        </button>
      </form>

      {!isSent && (
        <div className="grid gap-4 md:grid-cols-2">
          <form action={scheduleDraftAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="id" value={draft.id} />
            <h2 className="text-sm font-semibold">Schedule send</h2>
            <input
              name="scheduled_for"
              type="datetime-local"
              defaultValue={draft.scheduled_for ? new Date(draft.scheduled_for).toISOString().slice(0, 16) : ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white">Schedule</button>
            <p className="text-xs text-slate-500">Cron checks every 15 minutes.</p>
          </form>

          <form action={sendDraftNowAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="id" value={draft.id} />
            <h2 className="text-sm font-semibold">Send now</h2>
            <p className="text-sm text-slate-600">Dispatch immediately to all subscribers in this category.</p>
            <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
              Send now
            </button>
          </form>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Delivery stats</h2>
        {Object.keys(counts).length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No deliveries yet.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {Object.entries(counts).map(([k, v]) => (
              <li key={k} className="rounded-md bg-slate-50 p-3">
                <div className="text-xs uppercase text-slate-500">{k}</div>
                <div className="text-lg font-semibold">{v}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Preview</h2>
        <iframe
          srcDoc={draft.body_html}
          className="mt-2 h-[480px] w-full rounded-md border border-slate-200 bg-white"
        />
      </section>
    </div>
  );
}
