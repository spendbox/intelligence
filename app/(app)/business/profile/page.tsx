import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/originUrl";
import SlugField from "./SlugField";
import {
  deleteGalleryItemAction,
  removeLogoAction,
  saveProfileAction,
  uploadGalleryAction,
  uploadLogoAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id, business_name, display_name, slug, bio, phone, cac_number, verified, logo_url, website, instagram, twitter, facebook, linkedin, tiktok, whatsapp")
    .eq("user_id", session.userId!)
    .maybeSingle();
  if (!business) redirect("/business/setup");

  const { data: gallery } = await sb
    .from("business_gallery")
    .select("id, url, caption, sort_order")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  const origin = getOrigin().replace(/\/$/, "");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your public page</h1>
        <p className="mt-1 text-sm text-slate-600">
          Share with clients. <Link href={`/b/${business.slug}`} className="font-medium text-brand">View page →</Link>
        </p>
      </div>

      {searchParams.saved && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error === "slug_taken" ? "That URL is taken — pick another." : "Couldn't save your changes."}
        </p>
      )}

      {/* Logo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Logo</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-300">
                {(business.business_name || business.display_name || "F").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <form action={uploadLogoAction} encType="multipart/form-data" className="flex-1 space-y-2">
            <input
              type="file"
              name="logo"
              accept="image/*"
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
            />
            <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
              Upload
            </button>
          </form>
          {business.logo_url && (
            <form action={removeLogoAction}>
              <button className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                Remove
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Profile details */}
      <form action={saveProfileAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Public profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="business_name" label="Business name" defaultValue={business.business_name ?? ""} required />
          <Field name="display_name" label="Display name" defaultValue={business.display_name ?? ""} />
          <Field name="phone" label="Phone" defaultValue={business.phone ?? ""} />
          <Field name="cac_number" label="CAC number" defaultValue={business.cac_number ?? ""} hint="Optional" />
        </div>
        <SlugField initial={business.slug ?? ""} publicBase={origin} />
        <div>
          <label className="text-sm font-medium">About</label>
          <textarea name="bio" rows={4} defaultValue={business.bio ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold">Socials & links</h3>
          <p className="mt-1 text-xs text-slate-500">All optional. Will show on your public page.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field name="website" label="Website" defaultValue={business.website ?? ""} placeholder="https://yourbusiness.com" />
            <Field name="instagram" label="Instagram" defaultValue={business.instagram ?? ""} placeholder="@handle or full URL" />
            <Field name="twitter" label="X / Twitter" defaultValue={business.twitter ?? ""} placeholder="@handle" />
            <Field name="tiktok" label="TikTok" defaultValue={business.tiktok ?? ""} placeholder="@handle" />
            <Field name="facebook" label="Facebook" defaultValue={business.facebook ?? ""} />
            <Field name="linkedin" label="LinkedIn" defaultValue={business.linkedin ?? ""} />
            <Field name="whatsapp" label="WhatsApp" defaultValue={business.whatsapp ?? ""} placeholder="+234…" />
          </div>
        </div>

        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Save
        </button>
      </form>

      {/* Gallery */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Gallery</h2>
        <p className="mt-1 text-xs text-slate-500">Up to 12 images. JPG/PNG, max 5MB each.</p>

        <form action={uploadGalleryAction} encType="multipart/form-data" className="mt-3 space-y-2">
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
          />
          <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            Upload images
          </button>
        </form>

        {(gallery ?? []).length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(gallery ?? []).map((g) => (
              <li key={g.id} className="group relative overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.caption ?? ""} className="aspect-square w-full object-cover" />
                <form action={deleteGalleryItemAction} className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                  <input type="hidden" name="id" value={g.id} />
                  <button className="rounded-full bg-rose-600/90 px-2 py-1 text-xs font-medium text-white shadow hover:bg-rose-700">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/business/setup" className="inline-block text-sm font-medium text-brand">
        Edit industries, locations and budget ranges →
      </Link>
    </div>
  );
}

function Field({ name, label, defaultValue, required, hint, placeholder }: { name: string; label: string; defaultValue?: string; required?: boolean; hint?: string; placeholder?: string }) {
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
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
