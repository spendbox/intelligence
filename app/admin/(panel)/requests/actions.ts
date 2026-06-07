"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { suggestMatches, sendPendingLeadEmails } from "@/app/order/actions";
import { sendOrderApprovedEmail } from "@/lib/email/leads";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
  return session.email!;
}

export async function approveRequestAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/requests");

  const sb = supabaseAdmin();
  const { data: r } = await sb
    .from("lead_requests")
    .select("id, status, email, name")
    .eq("id", id)
    .single();
  if (!r) redirect("/admin/requests");

  if (r.status === "submitted") {
    await sb
      .from("lead_requests")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: admin })
      .eq("id", id);
    try {
      await sendOrderApprovedEmail(r.email, r.name);
    } catch {}
  }

  try {
    await suggestMatches(id);
  } catch {}

  redirect(`/admin/requests/${id}?ok=approved`);
}

export async function rejectRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 280) || null;
  if (!id) redirect("/admin/requests");
  const sb = supabaseAdmin();
  await sb.from("lead_requests").update({ status: "rejected", reject_reason: reason }).eq("id", id);
  redirect(`/admin/requests/${id}?ok=rejected`);
}

export async function addMatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  if (!requestId || !businessId) redirect(`/admin/requests/${requestId}`);
  const sb = supabaseAdmin();
  await sb
    .from("lead_notifications")
    .insert({ request_id: requestId, business_id: businessId, email_sent: false, added_by: admin });
  redirect(`/admin/requests/${requestId}?ok=added`);
}

export async function removeMatchAction(formData: FormData) {
  await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const businessId = String(formData.get("business_id") ?? "");
  const sb = supabaseAdmin();
  await sb
    .from("lead_notifications")
    .delete()
    .eq("request_id", requestId)
    .eq("business_id", businessId)
    .eq("email_sent", false); // safety: don't delete a notification we already emailed
  redirect(`/admin/requests/${requestId}?ok=removed`);
}

export async function sendMatchedEmailsAction(formData: FormData) {
  await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) redirect("/admin/requests");
  const { sent } = await sendPendingLeadEmails(requestId);
  redirect(`/admin/requests/${requestId}?ok=sent&n=${sent}`);
}

export async function deleteRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/requests");
  const sb = supabaseAdmin();
  await sb.from("lead_requests").delete().eq("id", id);
  redirect("/admin/requests?ok=deleted");
}
