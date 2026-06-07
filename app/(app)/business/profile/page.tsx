import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/originUrl";
import LogoUploader from "./LogoUploader";
import GalleryUploader from "./GalleryUploader";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

const GALLERY_CAP = 12;

export default async function ProfilePage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id, business_name, display_name, slug, bio, phone, cac_number, verified, logo_url, website, instagram, twitter, facebook, linkedin, tiktok, whatsapp, compliance_status")
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your public page</h1>
          <p className="mt-1 text-sm text-slate-600">
            Share with clients.{" "}
            <Link href={`/b/${business.slug}`} target="_blank" className="font-medium text-brand">
              View page ↗
            </Link>
          </p>
        </div>
        <Link
          href="/business/compliance"
          className={
            "rounded-full px-3 py-1 text-xs font-medium " +
            (business.compliance_status === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : business.compliance_status === "pending"
              ? "bg-amber-50 text-amber-700"
              : business.compliance_status === "rejected"
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-600")
          }
        >
          Compliance: {business.compliance_status ?? "unsubmitted"} →
        </Link>
      </div>

      {searchParams.error === "upload" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Couldn't upload that file. Make sure it's an image under 5MB.
        </p>
      )}

      {/* Logo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Logo</h2>
        <p className="mt-1 text-xs text-slate-500">PNG or JPG, max 5MB. Uploads automatically.</p>
        <LogoUploader
          currentUrl={business.logo_url}
          fallbackInitial={business.business_name || business.display_name || "F"}
        />
      </section>

      {/* Auto-saving profile fields */}
      <ProfileForm
        publicBase={origin}
        initial={{
          business_name: business.business_name ?? "",
          display_name: business.display_name ?? "",
          phone: business.phone ?? "",
          bio: business.bio ?? "",
          slug: business.slug ?? "",
          website: business.website ?? "",
          instagram: business.instagram ?? "",
          twitter: business.twitter ?? "",
          facebook: business.facebook ?? "",
          linkedin: business.linkedin ?? "",
          tiktok: business.tiktok ?? "",
          whatsapp: business.whatsapp ?? "",
        }}
      />

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
