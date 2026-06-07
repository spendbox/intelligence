"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { deleteFile, extensionOf, pathFromPublicUrl, uploadFile } from "@/lib/storage";

async function requireBusiness() {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");
  const sb = supabaseAdmin();
  const { data: biz } = await sb
    .from("businesses")
    .select("id, logo_url, id_document_url, registration_document_url, compliance_status")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!biz) redirect("/business/setup");
  return { sb, biz, userId: session.userId! };
}

const SaveSchema = z.object({
  kind: z.enum(["business", "individual"]),
  legal_name: z.string().max(160).optional(),
  registration_number: z.string().max(40).optional(),
  nin: z.string().max(11).optional(),
});

export async function saveComplianceAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  if (biz.compliance_status === "pending" || biz.compliance_status === "approved") return;
  const parsed = SaveSchema.safeParse({
    kind: formData.get("kind") ?? "business",
    legal_name: String(formData.get("legal_name") ?? ""),
    registration_number: String(formData.get("registration_number") ?? ""),
    nin: String(formData.get("nin") ?? ""),
  });
  if (!parsed.success) return;
  await sb
    .from("businesses")
    .update({
      compliance_kind: parsed.data.kind,
      legal_name: parsed.data.legal_name?.trim() || null,
      registration_number: parsed.data.registration_number?.trim() || null,
      nin: parsed.data.nin?.trim() || null,
    })
    .eq("id", biz.id);
}

const FIELDS = new Set(["id_document", "registration_document"]);

export async function uploadComplianceFileAction(formData: FormData) {
  const { sb, biz } = await requireBusiness();
  if (biz.compliance_status === "pending" || biz.compliance_status === "approved") return;

  const field = String(formData.get("field") ?? "");
  if (!FIELDS.has(field)) redirect("/business/compliance?error=upload");

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    redirect("/business/compliance?error=upload");
  }

  const ext = extensionOf(file, "pdf");
  const path = `businesses/${biz.id}/compliance/${field}-${Date.now()}.${ext}`;

  try {
    const up = await uploadFile({ file, path });
    const column = field === "id_document" ? "id_document_url" : "registration_document_url";
    const oldUrl = (biz as any)[column];
    if (oldUrl) {
      const p = pathFromPublicUrl(oldUrl);
      if (p) await deleteFile(p);
    }
    await sb.from("businesses").update({ [column]: up.publicUrl }).eq("id", biz.id);
  } catch (e: any) {
    console.error("[uploadCompliance]", e?.message);
    redirect("/business/compliance?error=upload");
  }
  redirect("/business/compliance?saved=1");
}

export async function submitComplianceAction(_formData: FormData) {
  const { sb, biz } = await requireBusiness();
  // Verify the checklist server-side
  const { data: row } = await sb
    .from("businesses")
    .select("id, logo_url, compliance_kind, legal_name, registration_number, nin, id_document_url, registration_document_url")
    .eq("id", biz.id)
    .single();
  if (!row) redirect("/business/compliance?error=incomplete");

  const okBase = !!row.legal_name && !!row.id_document_url && !!row.logo_url;
  const okType =
    row.compliance_kind === "business"
      ? !!row.registration_number && !!row.registration_document_url
      : !!row.nin && /^\d{11}$/.test(String(row.nin));

  const { count: galleryCount } = await sb
    .from("business_gallery")
    .select("*", { count: "exact", head: true })
    .eq("business_id", biz.id);
  const okGallery = (galleryCount ?? 0) >= 1;

  if (!okBase || !okType || !okGallery) redirect("/business/compliance?error=incomplete");

  await sb
    .from("businesses")
    .update({
      compliance_status: "pending",
      compliance_submitted_at: new Date().toISOString(),
      compliance_notes: null,
    })
    .eq("id", biz.id);

  redirect("/business/compliance?submitted=1");
}
