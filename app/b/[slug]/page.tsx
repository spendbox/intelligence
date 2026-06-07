import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IndustryIcon } from "@/lib/industryIcons";
import { SocialIcon, buildSocials } from "@/lib/socials";
import Gallery from "./Gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicBusinessPage({ params }: { params: { slug: string } }) {
  const sb = supabaseAdmin();
  const { data: b } = await sb
    .from("businesses")
    .select("id, display_name, business_name, bio, verified, logo_url, website, instagram, twitter, facebook, linkedin, tiktok, whatsapp, business_categories(category_id), business_locations(location)")
    .eq("slug", params.slug)
    .eq("setup_complete", true)
    .maybeSingle();
  if (!b) notFound();

  const catIds = ((b as any).business_categories ?? []).map((r: any) => r.category_id);
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, name")
    .in("id", catIds.length ? catIds : ["00000000-0000-0000-0000-000000000000"]);
  const locations = ((b as any).business_locations ?? []).map((r: any) => r.location);
  const { data: gallery } = await sb
    .from("business_gallery")
    .select("id, url, caption")
    .eq("business_id", b.id)
    .order("sort_order", { ascending: true })
    .limit(12);
  const socials = buildSocials(b);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-br from-brand to-fuchsia-500" />
          <div className="-mt-12 px-6 pb-8 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-sm">
                {b.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-slate-300">
                    {(b.business_name || b.display_name || "F").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              {b.verified && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verified</span>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Folio</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{b.business_name || b.display_name}</h1>
              {b.display_name && b.business_name !== b.display_name && (
                <p className="mt-1 text-sm text-slate-600">{b.display_name}</p>
              )}
            </div>

            {b.bio && <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{b.bio}</p>}

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

            {socials.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Connect</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <li key={s.key}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        <SocialIcon kind={s.key} className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {(gallery ?? []).length > 0 && (
          <div className="mt-6">
            <Gallery items={gallery ?? []} />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by{" "}
          <Link href="/" className="font-medium text-slate-500 hover:text-slate-700">
            folio.cafe
          </Link>
        </p>
      </div>
    </main>
  );
}
