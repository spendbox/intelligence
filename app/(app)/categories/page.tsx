import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IndustryIcon } from "@/lib/industryIcons";
import { saveCategoriesAction } from "./actions";

export const dynamic = "force-dynamic";

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
      <h1 className="text-2xl font-bold">Your industries</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pick the industries you operate in. We'll send insights for each one — up to 10 a month.
      </p>

      {searchParams.welcome && (
        <p className="mt-4 rounded-md bg-brand/5 px-3 py-2 text-sm text-slate-700">
          Welcome to Folio! Choose the industries that matter to you to start receiving insights.
        </p>
      )}

      {searchParams.saved && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Preferences saved.
        </p>
      )}

      <form action={saveCategoriesAction} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {(categories ?? []).map((c) => {
            const checked = selectedIds.has(c.id);
            return (
              <label
                key={c.id}
                className={
                  "flex items-start gap-3 rounded-2xl border p-4 transition cursor-pointer " +
                  (checked
                    ? "border-brand bg-brand/[0.04] shadow-[0_0_0_3px_rgba(124,58,237,0.08)]"
                    : "border-slate-200 bg-white hover:border-slate-300")
                }
              >
                <input
                  type="checkbox"
                  name="category"
                  value={c.id}
                  defaultChecked={checked}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 " +
                    (checked ? "bg-brand/10 text-brand ring-brand/20" : "bg-slate-50 text-slate-500 ring-slate-200")
                  }
                >
                  <IndustryIcon slug={c.slug} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 text-sm text-slate-600">{c.description}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
          Save preferences
        </button>
      </form>
    </div>
  );
}
