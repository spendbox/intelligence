"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { matchAndNotifyBusinesses } from "@/app/order/actions";
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
  if (!r || r.status !== "submitted") redirect(`/admin/requests/${id}`);

  await sb
    .from("lead_requests")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: admin })
    .eq("id", id);

  let matched = 0;
  try {
    const out = await matchAndNotifyBusinesses(id);
    matched = out.notified;
  } catch {}

  try {
    await sendOrderApprovedEmail(r.email, r.name);
  } catch {}

  redirect(`/admin/requests/${id}?ok=1&matched=${matched}`);
}

export async function rejectRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 280) || null;
  if (!id) redirect("/admin/requests");
  const sb = supabaseAdmin();
  await sb.from("lead_requests").update({ status: "rejected", reject_reason: reason }).eq("id", id);
  redirect(`/admin/requests/${id}?ok=1`);
}
