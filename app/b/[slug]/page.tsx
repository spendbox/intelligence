import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IndustryIcon } from "@/lib/industryIcons";

export const dynamic = "force-dynamic";

export default async function PublicBusinessPage({ params }: { params: { slug: string } }) {
  const sb = supabaseAdmin();
  const { data: b } = await sb
    .from("businesses")
    .select("id, display_name, business_name, bio, verified, business_categories(category_id), business_locations(location)")
    .eq("slug", params.slug)
    .eq("setup_complete", true)
    .maybeSingle();
  if (!b) notFound();

  const catIds = ((b as any).business_categories ?? []).map((r: any) => r.category_id);
  const { data: cats } = await sb.from("categories").select("id, slug, name").in("id", catIds.length ? catIds : ["00000000-0000-0000-0000-000000000000"]);

  const locations = ((b as any).business_locations ?? []).map((r: any) => r.location);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Folio</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{b.business_name || b.display_name}</h1>
              {b.display_name && b.business_name !== b.display_name && (
                <p className="mt-1 text-sm text-slate-600">{b.display_name}</p>
              )}
            </div>
            {b.verified && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verified</span>
            )}
          </div>

          {b.bio && <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{b.bio}</p>}

          {(cats ?? []).length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Industries</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {(cats ?? []).map((c: any) => (
                  <li key={c.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <IndustryIcon slug={c.slug} className="h-3.5 w-3.5" /> {c.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {locations.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Serves</p>
              <p className="mt-1 text-sm text-slate-800">{locations.join(" · ")}</p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Powered by folio.cafe</p>
      </div>
    </main>
  );
}
