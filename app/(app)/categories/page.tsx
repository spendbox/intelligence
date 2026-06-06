import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveCategoriesAction } from "./actions";

export default async function CategoriesPage({ searchParams }: { searchParams: { saved?: string; welcome?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name, description")
    .eq("active", true)
    .order("name");

  const { data: selected } = await sb
    .from("user_categories")
    .select("category_id")
    .eq("user_id", session.userId!);

  const selectedIds = new Set((selected ?? []).map((r) => r.category_id));

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-slate-600">
        Choose which monthly insights you want to receive — up to 10 sent each month.
      </p>

      {searchParams.welcome && (
        <p className="mt-4 rounded-md bg-brand/5 px-3 py-2 text-sm text-slate-700">
          Welcome to Folio! Pick the categories you care about to start receiving insights.
        </p>
      )}

      {searchParams.saved && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Preferences saved.
        </p>
      )}

      <form action={saveCategoriesAction} className="mt-6 space-y-3">
        {(categories ?? []).map((c) => (
          <label
            key={c.id}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand"
          >
            <input
              type="checkbox"
              name="category"
              value={c.id}
              defaultChecked={selectedIds.has(c.id)}
              className="mt-1 h-4 w-4"
            />
            <div>
              <p className="font-medium">{c.name}</p>
              {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
            </div>
          </label>
        ))}
        <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
          Save preferences
        </button>
      </form>
    </div>
  );
}
