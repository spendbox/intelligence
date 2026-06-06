"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { renderMarkdown, wrapEmailHtml } from "@/lib/markdown";
import { sendInsightEmail } from "@/lib/email/resend";
import { generateInsight, polishDraft } from "@/lib/openai";

const DraftSchema = z.object({
  category_id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body_md: z.string().min(1),
});

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
  return session.email!;
}

export async function createDraftAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = DraftSchema.safeParse({
    category_id: formData.get("category_id"),
    subject: formData.get("subject"),
    body_md: formData.get("body_md"),
  });
  if (!parsed.success) redirect("/admin/insights?error=1");

  const body_html = wrapEmailHtml(parsed.data.subject, renderMarkdown(parsed.data.body_md));
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("insight_drafts")
    .insert({ ...parsed.data, body_html, status: "draft", created_by: admin })
    .select("id")
    .single();
  if (error || !data) redirect("/admin/insights?error=1");
  redirect(`/admin/insights/${data.id}`);
}

const UpdateSchema = DraftSchema.extend({ id: z.string().uuid() });

export async function updateDraftAction(formData: FormData) {
  await requireAdmin();
  const parsed = UpdateSchema.safeParse({
    id: formData.get("id"),
    category_id: formData.get("category_id"),
    subject: formData.get("subject"),
    body_md: formData.get("body_md"),
  });
  if (!parsed.success) redirect("/admin/insights?error=1");

  const body_html = wrapEmailHtml(parsed.data.subject, renderMarkdown(parsed.data.body_md));
  const sb = supabaseAdmin();
  await sb
    .from("insight_drafts")
    .update({
      category_id: parsed.data.category_id,
      subject: parsed.data.subject,
      body_md: parsed.data.body_md,
      body_html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  redirect(`/admin/insights/${parsed.data.id}?saved=1`);
}

export async function scheduleDraftAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const when = String(formData.get("scheduled_for") ?? "");
  if (!id || !when) redirect(`/admin/insights/${id}?error=1`);
  const sb = supabaseAdmin();
  await sb
    .from("insight_drafts")
    .update({ status: "scheduled", scheduled_for: new Date(when).toISOString() })
    .eq("id", id);
  redirect(`/admin/insights/${id}?scheduled=1`);
}

export async function generateDraftAction(formData: FormData) {
  const admin = await requireAdmin();
  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) redirect("/admin/insights?error=no_category");

  const sb = supabaseAdmin();
  const { data: cat } = await sb
    .from("categories")
    .select("id, name, description")
    .eq("id", categoryId)
    .single();
  if (!cat) redirect("/admin/insights?error=no_category");

  let generated;
  try {
    generated = await generateInsight({ industryName: cat.name, industryDescription: cat.description });
  } catch (e: any) {
    redirect(`/admin/insights?error=ai&msg=${encodeURIComponent(String(e?.message ?? "AI failed"))}`);
  }

  const body_html = wrapEmailHtml(generated.subject, renderMarkdown(generated.body_md));
  const { data, error } = await sb
    .from("insight_drafts")
    .insert({
      category_id: cat.id,
      subject: generated.subject,
      body_md: generated.body_md,
      body_html,
      status: "draft",
      created_by: admin,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/admin/insights?error=server");
  redirect(`/admin/insights/${data.id}?generated=1`);
}

export async function polishDraftAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/insights");

  const sb = supabaseAdmin();
  const { data: draft } = await sb
    .from("insight_drafts")
    .select("id, subject, body_md, category_id, status, categories(name)")
    .eq("id", id)
    .single();
  if (!draft || draft.status === "sent") redirect(`/admin/insights/${id}`);

  const industryName = (draft as any).categories?.name ?? "general";
  let polished;
  try {
    polished = await polishDraft({
      industryName,
      subject: draft.subject,
      body_md: draft.body_md,
    });
  } catch (e: any) {
    redirect(`/admin/insights/${id}?error=ai&msg=${encodeURIComponent(String(e?.message ?? "AI failed"))}`);
  }

  const body_html = wrapEmailHtml(polished.subject, renderMarkdown(polished.body_md));
  await sb
    .from("insight_drafts")
    .update({
      subject: polished.subject,
      body_md: polished.body_md,
      body_html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  redirect(`/admin/insights/${id}?polished=1`);
}

export async function deleteDraftAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/insights");
  const sb = supabaseAdmin();
  await sb.from("insight_drafts").delete().eq("id", id);
  redirect("/admin/insights");
}

export async function sendDraftNowAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/insights?error=1");
  await dispatchInsight(id);
  redirect(`/admin/insights/${id}?sent=1`);
}

// Shared dispatcher — also used by the cron route.
export async function dispatchInsight(insightId: string) {
  const sb = supabaseAdmin();
  const { data: insight } = await sb
    .from("insight_drafts")
    .select("id, subject, body_html, category_id, status")
    .eq("id", insightId)
    .single();
  if (!insight || insight.status === "sent") return;

  // Recipients: users with status trialing/active subscribed to this category.
  const { data: recipients } = await sb
    .from("user_categories")
    .select("user_id, users!inner(id, email, status)")
    .eq("category_id", insight.category_id)
    .in("users.status", ["trialing", "active"]);

  const list = (recipients ?? []) as unknown as Array<{
    user_id: string;
    users: { email: string } | { email: string }[];
  }>;

  for (const row of list) {
    const email = Array.isArray(row.users) ? row.users[0]?.email : row.users?.email;
    if (!email) continue;
    try {
      const res = await sendInsightEmail({
        to: email,
        subject: insight.subject,
        html: insight.body_html,
      });
      await sb.from("email_deliveries").insert({
        insight_id: insight.id,
        user_id: row.user_id,
        resend_message_id: (res as any)?.data?.id ?? null,
        status: "sent",
      });
    } catch (e: any) {
      await sb.from("email_deliveries").insert({
        insight_id: insight.id,
        user_id: row.user_id,
        status: "failed",
        error: String(e?.message ?? e),
      });
    }
  }

  await sb
    .from("insight_drafts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", insight.id);
}
