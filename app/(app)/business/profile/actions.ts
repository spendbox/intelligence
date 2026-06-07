"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { deleteFile, extensionOf, pathFromPublicUrl, uploadFile } from "@/lib/storage";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function requireBusiness() {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");
  const sb = supabaseAdmin();
  const { data: biz } = await sb.from("businesses").select("id, slug, logo_url").eq("user_id", session.userId).maybeSingle();
  if (!biz) redirect("/business/setup");
  return { sb, biz, userId: session.userId! };
}

const ProfileSchema = z.object({
  business_name: z.string().min(1).max(120),
  display_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  cac_number: z.string().max(40).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  slug: z.string().regex(SLUG_RE).min(3).max(60),
  website: z.string().max(200).optional().nullable(),
  instagram: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  tiktok: z.string().max(200).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
});

export async function saveProfileAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  const parsed = ProfileSchema.safeParse({
    business_name: String(formData.get("business_name") ?? "").trim(),
    display_name: String(formData.get("display_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    cac_number: String(formData.get("cac_number") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    website: String(formData.get("website") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    twitter: String(formData.get("twitter") ?? "").trim() || null,
    facebook: String(formData.get("facebook") ?? "").trim() || null,
    linkedin: String(formData.get("linkedin") ?? "").trim() || null,
    tiktok: String(formData.get("tiktok") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
  });
  if (!parsed.success) redirect("/business/profile?error=invalid");

  if (parsed.data.slug !== biz.slug) {
    const { data: taken } = await sb.from("businesses").select("id").eq("slug", parsed.data.slug).maybeSingle();
    if (taken) redirect("/business/profile?error=slug_taken");
  }

  await sb.from("businesses").update(parsed.data).eq("id", biz.id);
  redirect("/business/profile?saved=1");
}

export async function uploadLogoAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  const file = formData.get("logo") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) redirect("/business/profile?error=upload");
  if (file.size > 5 * 1024 * 1024) redirect("/business/profile?error=upload");

  const ext = extensionOf(file, "png");
  const path = `businesses/${biz.id}/logo-${Date.now()}.${ext}`;
  try {
    const up = await uploadFile({ file, path });
    // Remove old logo if it lives in our storage
    if (biz.logo_url) {
      const oldPath = pathFromPublicUrl(biz.logo_url);
      if (oldPath) await deleteFile(oldPath);
    }
    await sb.from("businesses").update({ logo_url: up.publicUrl }).eq("id", biz.id);
  } catch (e: any) {
    console.error("[uploadLogo]", e?.message);
    redirect("/business/profile?error=upload");
  }
  redirect("/business/profile?saved=1");
}

export async function removeLogoAction() {
  const { sb, biz } = await requireBusiness();
  if (biz.logo_url) {
    const p = pathFromPublicUrl(biz.logo_url);
    if (p) await deleteFile(p);
  }
  await sb.from("businesses").update({ logo_url: null }).eq("id", biz.id);
  redirect("/business/profile?saved=1");
}

const GALLERY_CAP = 12;

export async function uploadGalleryAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) redirect("/business/profile?error=upload");

  const { count } = await sb
    .from("business_gallery")
    .select("*", { count: "exact", head: true })
    .eq("business_id", biz.id);
  const remaining = Math.max(0, GALLERY_CAP - (count ?? 0));
  const slice = files.slice(0, remaining);

  for (const f of slice) {
    if (f.size > 5 * 1024 * 1024) continue;
    const ext = extensionOf(f, "jpg");
    const path = `businesses/${biz.id}/gallery/${randomUUID()}.${ext}`;
    try {
      const up = await uploadFile({ file: f, path });
      await sb.from("business_gallery").insert({ business_id: biz.id, url: up.publicUrl });
    } catch (e: any) {
      console.error("[uploadGallery]", e?.message);
    }
  }
  redirect("/business/profile?saved=1");
}

export async function deleteGalleryItemAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/business/profile");
  const { data: row } = await sb.from("business_gallery").select("id, url").eq("id", id).eq("business_id", biz.id).maybeSingle();
  if (!row) redirect("/business/profile");
  const p = pathFromPublicUrl(row.url);
  if (p) await deleteFile(p);
  await sb.from("business_gallery").delete().eq("id", row.id);
  redirect("/business/profile?saved=1");
}
