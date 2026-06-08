"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { suggestMatches, sendPendingLeadEmails } from "@/app/order/actions";
import { sendOrderApprovedEmail } from "@/lib/email/leads";
import { unlockCreditsFor, UNLOCK_CAP_DEFAULT } from "@/lib/leads";
import { getSettings } from "@/lib/settings";

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

const AdminCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  description: z.string().min(5).max(2000),
  category_id: z.string().uuid().nullable().optional(),
  location: z.string().min(2).max(120),
  budget_min: z.coerce.number().int().min(0),
  budget_max: z.coerce.number().int().min(1),
  notify: z.coerce.boolean().optional(),
});

export async function createAdminRequestAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = AdminCreateSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: formData.get("phone"),
    description: formData.get("description"),
    category_id: (formData.get("category_id") as string) || null,
    location: formData.get("location"),
    budget_min: formData.get("budget_min"),
    budget_max: formData.get("budget_max"),
    notify: formData.get("notify") === "on",
  });
  if (!parsed.success) redirect("/admin/requests/new?error=invalid");
  if (parsed.data.budget_max < parsed.data.budget_min) redirect("/admin/requests/new?error=budget");

  const settings = await getSettings();
  const unlockCredits = unlockCreditsFor(parsed.data.budget_max, settings.unlock_rate || 0.00001);

  const sb = supabaseAdmin();
  const baseRow: Record<string, any> = {
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone,
    description: parsed.data.description,
    category_id: parsed.data.category_id ?? null,
    budget_min: parsed.data.budget_min,
    budget_max: parsed.data.budget_max,
    location: parsed.data.location,
    status: "approved",
    unlock_credits: unlockCredits,
    unlocks_cap: UNLOCK_CAP_DEFAULT,
    approved_at: new Date().toISOString(),
    approved_by: admin,
  };
  const extras: Record<string, any> = {
    is_priority: false,
    priority_amount_naira: null,
    terms_accepted_at: new Date().toISOString(),
  };

  let created: { id: string } | null = null;
  for (const row of [{ ...baseRow, ...extras }, baseRow]) {
    const { data, error } = await sb.from("lead_requests").insert(row).select("id").single();
    if (data) {
      created = data;
      break;
    }
    if (!error || !/column .* does not exist/i.test(String(error.message ?? ""))) break;
  }
  if (!created) redirect("/admin/requests/new?error=server");

  try {
    await suggestMatches(created.id);
  } catch {}

  // Optionally dispatch emails immediately. No customer email is sent
  // because the customer didn't post this themselves.
  if (parsed.data.notify) {
    try {
      await sendPendingLeadEmails(created.id);
    } catch {}
  }

  redirect(`/admin/requests/${created.id}?ok=created`);
}

export async function deleteRequestAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/requests");
  const sb = supabaseAdmin();
  await sb.from("lead_requests").delete().eq("id", id);
  redirect("/admin/requests?ok=deleted");
}
