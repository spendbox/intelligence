"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendBusinessApprovedEmail } from "@/lib/email/leads";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
}

export async function approveBusinessAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/businesses");

  const sb = supabaseAdmin();
  const { data: biz } = await sb
    .from("businesses")
    .select("id, slug, business_name, display_name, verified, users(email)")
    .eq("id", id)
    .maybeSingle();
  if (!biz) redirect("/admin/businesses");

  await sb.from("businesses").update({ verified: true }).eq("id", id);

  if (!biz.verified && (biz as any).users?.email) {
    try {
      await sendBusinessApprovedEmail((biz as any).users.email, {
        businessName: biz.business_name || biz.display_name || "there",
        slug: biz.slug,
      });
    } catch {}
  }

  redirect("/admin/businesses?ok=1");
}

export async function revokeBusinessAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/businesses");
  const sb = supabaseAdmin();
  await sb.from("businesses").update({ verified: false }).eq("id", id);
  redirect("/admin/businesses?ok=1");
}

export async function approveComplianceAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/businesses");
  const sb = supabaseAdmin();
  const { data: biz } = await sb
    .from("businesses")
    .select("id, slug, business_name, display_name, verified, users(email)")
    .eq("id", id)
    .maybeSingle();
  if (!biz) redirect("/admin/businesses");

  await sb
    .from("businesses")
    .update({
      compliance_status: "approved",
      compliance_reviewed_at: new Date().toISOString(),
      compliance_reviewer: session.email,
      verified: true,
    })
    .eq("id", id);

  if (!biz.verified && (biz as any).users?.email) {
    try {
      await sendBusinessApprovedEmail((biz as any).users.email, {
        businessName: biz.business_name || biz.display_name || "there",
        slug: biz.slug,
      });
    } catch {}
  }

  redirect(`/admin/businesses/${id}?ok=approved`);
}

export async function rejectComplianceAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 280) || null;
  if (!id) redirect("/admin/businesses");
  const sb = supabaseAdmin();
  await sb
    .from("businesses")
    .update({
      compliance_status: "rejected",
      compliance_reviewed_at: new Date().toISOString(),
      compliance_reviewer: session.email,
      compliance_notes: reason,
    })
    .eq("id", id);
  redirect(`/admin/businesses/${id}?ok=rejected`);
}
