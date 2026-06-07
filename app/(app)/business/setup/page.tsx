import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveBusinessSetupAction } from "./actions";
import { BUDGET_PRESETS } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function BusinessSetupPage({ searchParams }: { searchParams: { error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb
    .from("businesses")
    .select("id, business_name, display_name, bio, phone, cac_number")
    .eq("user_id", session.userId!)
    .maybeSingle();

  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name")
    .eq("active", true)
    .order("name");

  let selectedCats: Set<string> = new Set();
  let selectedLocs: string[] = [];
  let selectedBudgets: Set<number> = new Set();

  if (business?.id) {
    const { data: cats } = await sb.from("business_categories").select("category_id").eq("business_id", business.id);
    selectedCats = new Set((cats ?? []).map((r) => r.category_id));
    const { data: locs } = await sb.from("business_locations").select("location").eq("business_id", business.id);
    selectedLocs = (locs ?? []).map((r) => r.location);
    const { data: ranges } = await sb.from("business_budget_ranges").select("budget_min, budget_max").eq("business_id", business.id);
    const set = new Set<number>();
    for (const r of ranges ?? []) {
      const i = BUDGET_PRESETS.findIndex((p) => p.min === r.budget_min && p.max === r.budget_max);
      if (i >= 0) set.add(i);
    }
    selectedBudgets = set;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your business</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell us about your business so we can route the right leads to you. All compliance docs are optional but help build trust with clients.
        </p>
      </div>

      <form action={saveBusinessSetupAction} className="space-y-6">
        {/* Business info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Business info</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field name="business_name" label="Business name" defaultValue={business?.business_name ?? ""} required />
            <Field name="display_name" label="Display name" defaultValue={business?.display_name ?? ""} />
            <Field name="phone" label="Phone" defaultValue={business?.phone ?? ""} />
            <Field name="cac_number" label="CAC number" defaultValue={business?.cac_number ?? ""} hint="Optional" />
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium">What you do</label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={business?.bio ?? ""}
              placeholder="A short description that will appear on your public page."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* Industries */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Industries you serve</h2>
          <p className="mt-1 text-xs text-slate-500">Pick up to 3 industries.</p>
          <div id="industries" className="mt-3 grid gap-2 sm:grid-cols-2">
            {(categories ?? []).map((c) => (
              <label key={c.id} className="industry-row flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:disabled]:opacity-50 hover:bg-slate-50">
                <input type="checkbox" name="category" value={c.id} defaultChecked={selectedCats.has(c.id)} className="industry-cb h-4 w-4 accent-brand" />
                {c.name}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500"><span id="industry-count">0</span> / 3 selected</p>
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => {
                const root = document.getElementById('industries');
                if (!root) return;
                const inputs = root.querySelectorAll('.industry-cb');
                const counter = document.getElementById('industry-count');
                const update = () => {
                  const checked = Array.from(inputs).filter(i => i.checked);
                  if (counter) counter.textContent = String(checked.length);
                  inputs.forEach(i => { if (!i.checked) i.disabled = checked.length >= 3; });
                };
                inputs.forEach(i => i.addEventListener('change', update));
                update();
              })();`,
            }}
          />
        </section>

        {/* Locations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Locations you deliver to</h2>
          <p className="mt-1 text-xs text-slate-500">Comma-separated. e.g. "Lagos, Abuja, Port Harcourt"</p>
          <input
            name="locations"
            defaultValue={selectedLocs.join(", ")}
            placeholder="Lagos, Abuja"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </section>

        {/* Budget ranges */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Budget ranges you take</h2>
          <p className="mt-1 text-xs text-slate-500">Pick all ranges that match your typical clients.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BUDGET_PRESETS.map((b, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <input type="checkbox" name="budget" value={i} defaultChecked={selectedBudgets.has(i)} className="h-4 w-4 accent-brand" />
                {b.label}
              </label>
            ))}
          </div>
        </section>

        {searchParams.error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Please fill in at least your business name, one industry, one location, and one budget range.</p>
        )}

        <button className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Save & continue
        </button>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue, required, hint }: { name: string; label: string; defaultValue?: string; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">{hint}</span>}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
