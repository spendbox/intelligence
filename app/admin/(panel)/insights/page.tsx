import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createDraftAction, deleteDraftAction, generateDraftAction } from "./actions";
import ConfirmForm from "@/components/ConfirmForm";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-amber-50 text-amber-700",
    sent: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default async function AdminInsightsPage() {
  const sb = supabaseAdmin();
  const { data: categories } = await sb.from("categories").select("id, name").eq("active", true).order("name");
  const { data: drafts } = await sb
    .from("insight_drafts")
    .select("id, subject, status, scheduled_for, sent_at, category_id, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: userCount } = await sb.from("users").select("*", { count: "exact", head: true });
  const { count: deliveryCount } = await sb.from("email_deliveries").select("*", { count: "exact", head: true });
  const { count: scheduledCount } = await sb
    .from("insight_drafts")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-slate-600">Compose, schedule, and send monthly insights.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total users" value={userCount ?? 0} />
        <StatCard label="Scheduled drafts" value={scheduledCount ?? 0} />
        <StatCard label="Deliveries" value={deliveryCount ?? 0} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/[0.04] to-fuchsia-50 p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Generate with AI</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pick an industry — OpenAI drafts a full insight email you can edit and send.
            </p>
          </div>
          <span className="hidden rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:inline">
            powered by OpenAI
          </span>
        </div>
        <form action={generateDraftAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            name="category_id"
            required
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Select an industry…</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Generate draft
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold">New insight</h2>
        <form action={createDraftAction} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                name="category_id"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select a category…</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                name="subject"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Monthly cash flow insight — June"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Body (Markdown)</label>
            <textarea
              name="body_md"
              required
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={"# Heading\n\nParagraph text. **bold**, *italic*, [links](https://example.com)\n\n- bullet"}
            />
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Save draft
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold">Recent drafts</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Scheduled</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {(drafts ?? []).map((d: any) => (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium">{d.subject}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.categories?.name}</td>
                  <td className="px-4 py-2.5"><StatusPill status={d.status} /></td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {d.scheduled_for ? new Date(d.scheduled_for).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/insights/${d.id}`} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Open
                      </Link>
                      <ConfirmForm
                        action={deleteDraftAction}
                        hidden={[{ name: "id", value: d.id }]}
                        trigger={{
                          label: "Delete",
                          className: "rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50",
                        }}
                        title="Delete this draft?"
                        message="The draft and any delivery records linked to it will be removed. Can't be undone."
                        confirmLabel="Delete draft"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(!drafts || drafts.length === 0) && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                    No drafts yet.
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
    </div>
  );
}
