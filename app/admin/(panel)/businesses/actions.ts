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
