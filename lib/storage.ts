import { supabaseAdmin } from "@/lib/supabase/server";

export const BUCKET = "folio-uploads";

let _ensured = false;

export async function ensureBucket() {
  if (_ensured) return;
  const sb = supabaseAdmin();

  const { data, error: getErr } = await sb.storage.getBucket(BUCKET);
  if (data) {
    if (!data.public) {
      const { error } = await sb.storage.updateBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (error) console.error("[storage] updateBucket failed:", error.message);
    }
    _ensured = true;
    return;
  }

  if (getErr) {
    const { error: createErr } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (createErr) {
      const msg = String(createErr.message ?? "").toLowerCase();
      if (!msg.includes("already exists") && !msg.includes("duplicate")) {
        console.error("[storage] createBucket failed:", createErr.message);
        throw createErr;
      }
      // Bucket already exists — force public.
      const { error: upErr } = await sb.storage.updateBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (upErr) console.error("[storage] updateBucket (after exists) failed:", upErr.message);
    }
  }
  _ensured = true;
}

export type UploadedFile = { path: string; publicUrl: string };

export async function uploadFile(opts: {
  file: File;
  path: string; // e.g. businesses/<id>/logo.png
}): Promise<UploadedFile> {
  await ensureBucket();
  const sb = supabaseAdmin();
  const bytes = new Uint8Array(await opts.file.arrayBuffer());
  const { error } = await sb.storage.from(BUCKET).upload(opts.path, bytes, {
    contentType: opts.file.type || "application/octet-stream",
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    console.error("[storage] upload failed:", opts.path, error.message);
    throw error;
  }
  const { data } = sb.storage.from(BUCKET).getPublicUrl(opts.path);
  return { path: opts.path, publicUrl: data.publicUrl };
}

export async function deleteFile(path: string) {
  const sb = supabaseAdmin();
  await sb.storage.from(BUCKET).remove([path]);
}

export function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}

export function extensionOf(file: File, fallback = "bin"): string {
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  if (dot >= 0 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase().slice(0, 5);
  const mime = (file.type || "").split("/")[1];
  return (mime || fallback).toLowerCase().slice(0, 5);
}
