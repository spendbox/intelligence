import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createDraftAction } from "./actions";

export default async function AdminInsightsPage() {
  const sb = supabaseAdmin();
  const { data: categories } = await sb.from("categories").select("id, name").eq("active", true).order("name");
  const { data: drafts } = await sb
    .from("insight_drafts")
    .select("id, subject, status, scheduled_for, sent_at, category_id, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">New insight</h1>
        <form action={createDraftAction} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              name="category_id"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Monthly cash flow insight — June"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Body (Markdown)</label>
            <textarea
              name="body_md"
              required
              rows={10}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={"# Heading\n\nParagraph text. **bold**, *italic*, [links](https://example.com)\n\n- bullet"}
            />
          </div>
          <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Save draft
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent drafts</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Scheduled</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(drafts ?? []).map((d: any) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{d.subject}</td>
                  <td className="px-4 py-2">{d.categories?.name}</td>
                  <td className="px-4 py-2 capitalize">{d.status}</td>
                  <td className="px-4 py-2">
                    {d.scheduled_for ? new Date(d.scheduled_for).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/insights/${d.id}`} className="text-brand">Open</Link>
                  </td>
                </tr>
              ))}
              {(!drafts || drafts.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
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
