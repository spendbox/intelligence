import { supabaseAdmin } from "@/lib/supabase/server";
import { createCategoryAction, deleteCategoryAction, toggleCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const sb = supabaseAdmin();
  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name, description, active")
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-slate-600">Add, edit, or disable insight categories.</p>
      </div>

      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>
      )}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {searchParams.error === "slug_taken" ? "That slug is already in use." : "Something went wrong."}
        </p>
      )}

      <form action={createCategoryAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Add a category</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Finance"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <input
              name="slug"
              required
              pattern="[a-z0-9-]+"
              placeholder="finance"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">Lowercase, dashes only. Used internally.</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <input
            name="description"
            placeholder="Short blurb shown to users."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
          Add category
        </button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">All categories</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((c) => (
                <tr key={c.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{c.slug}</td>
                  <td className="px-4 py-2 text-slate-600">{c.description ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        c.active
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <form action={toggleCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50">
                          {c.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(!categories || categories.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Deleting a category removes it for all users. Disabling hides it from new selections but
          keeps existing data.
        </p>
      </section>
    </div>
  );
}
