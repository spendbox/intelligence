import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/originUrl";
import SlugField from "./SlugField";
import LogoUploader from "./LogoUploader";
import GalleryUploader from "./GalleryUploader";
import { saveProfileAction } from "./actions";

export const dynamic = "force-dynamic";

const GALLERY_CAP = 12;

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
  const capRemaining = Math.max(0, GALLERY_CAP - (gallery?.length ?? 0));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your public page</h1>
        <p className="mt-1 text-sm text-slate-600">
          Share with clients. <Link href={`/b/${business.slug}`} target="_blank" className="font-medium text-brand">View page ↗</Link>
        </p>
      </div>

      {searchParams.saved && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error === "slug_taken"
            ? "That URL is taken — pick another."
            : searchParams.error === "upload"
            ? "Couldn't upload that file. Make sure it's an image under 5MB."
            : "Couldn't save your changes."}
        </p>
      )}

      {/* Logo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Logo</h2>
        <p className="mt-1 text-xs text-slate-500">PNG or JPG, max 5MB. Uploads automatically.</p>
        <LogoUploader currentUrl={business.logo_url} fallbackInitial={business.business_name || business.display_name || "F"} />
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
        <p className="mt-1 text-xs text-slate-500">Up to {GALLERY_CAP} images. JPG/PNG, max 5MB each. Uploads start automatically.</p>
        <GalleryUploader items={gallery ?? []} capRemaining={capRemaining} />
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
