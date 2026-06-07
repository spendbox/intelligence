"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePin, hashPin, PIN_MAX_ATTEMPTS, PIN_TTL_MINUTES, verifyPin } from "@/lib/auth/pin";
import { sendBusinessLeadEmail, sendOrderReceivedEmail, sendOrderVerificationEmail, sendAdminNewRequestEmail } from "@/lib/email/leads";
import { env } from "@/lib/env";
import { locationsMatch, MIN_NOTIFICATION_CREDITS, unlockCreditsFor, UNLOCK_CAP_DEFAULT, formatBudgetRange, formatCredits } from "@/lib/leads";
import { extensionOf, uploadFile } from "@/lib/storage";
import { getSettings } from "@/lib/settings";

const SuggestSchema = z.object({ description: z.string().min(5).max(2000) });

export async function suggestIndustryAction(formData: FormData): Promise<{ categoryId: string | null; categoryName: string | null }> {
  const parsed = SuggestSchema.safeParse({ description: formData.get("description") });
  if (!parsed.success) return { categoryId: null, categoryName: null };

  const sb = supabaseAdmin();
  const { data: cats } = await sb.from("categories").select("id, slug, name, description").eq("active", true);
  const choices = (cats ?? []).map((c) => `${c.slug}: ${c.name}${c.description ? " — " + c.description : ""}`).join("\n");

  if (!env.openaiKeySafe()) {
    const lc = parsed.data.description.toLowerCase();
    const guess = (cats ?? []).find((c) => lc.includes(c.name.toLowerCase().split(" ")[0]));
    return { categoryId: guess?.id ?? null, categoryName: guess?.name ?? null };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.openaiKey()}` },
      body: JSON.stringify({
        model: env.openaiModel(),
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          { role: "system", content: "Pick the single best matching category for the request. Reply with JSON { slug: string }." },
          { role: "user", content: `Categories:\n${choices}\n\nRequest:\n${parsed.data.description}` },
        ],
      }),
      cache: "no-store",
    });
    const j: any = await res.json();
    const slug = JSON.parse(j.choices?.[0]?.message?.content ?? "{}").slug;
    const match = (cats ?? []).find((c) => c.slug === slug);
    return { categoryId: match?.id ?? null, categoryName: match?.name ?? null };
  } catch {
    return { categoryId: null, categoryName: null };
  }
}

export async function improveDescriptionAction(formData: FormData): Promise<{ ok: boolean; description?: string; error?: string }> {
  const desc = String(formData.get("description") ?? "").trim();
  if (desc.length < 8) return { ok: false, error: "Add a bit more detail first." };
  if (!env.openaiKeySafe()) return { ok: false, error: "AI is not configured." };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.openaiKey()}` },
      body: JSON.stringify({
        model: env.openaiModel(),
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You rewrite a customer's service request to be clear, specific and concise, with the same intent. Keep the same facts; add missing details only if obvious (timeline, quantity, location specificity). Avoid emojis. 4 sentences or fewer. Reply as JSON: { \"description\": string }.",
          },
          { role: "user", content: desc },
        ],
      }),
      cache: "no-store",
    });
    const j: any = await res.json();
    const out = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    if (!out.description) return { ok: false, error: "Couldn't improve. Try again." };
    return { ok: true, description: String(out.description) };
  } catch (e: any) {
    return { ok: false, error: "AI request failed." };
  }
}

const SendCodeSchema = z.object({ email: z.string().email() });

export async function sendOrderCodeAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const parsed = SendCodeSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };

  const sb = supabaseAdmin();
  const code = generatePin();
  const codeHash = await hashPin(code);
  await sb.from("order_email_verifications").insert({
    email: parsed.data.email,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString(),
  });
  try {
    await sendOrderVerificationEmail(parsed.data.email, code);
  } catch {
    return { ok: false, error: "Couldn't send the email — please retry." };
  }
  return { ok: true };
}

const SubmitSchema = z.object({
  description: z.string().min(5).max(2000),
  category_id: z.string().uuid().nullable().optional(),
  budget_min: z.coerce.number().int().min(0),
  budget_max: z.coerce.number().int().min(1),
  location: z.string().min(2).max(120),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(40),
  email: z.string().email(),
  code: z.string().regex(/^\d{4}$/),
  is_priority: z.coerce.boolean().optional(),
  priority_amount: z.coerce.number().int().min(500).max(10_000).optional(),
  terms: z.coerce.boolean(),
});

export async function submitOrderAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string; priorityRedirect?: string }> {
  const parsed = SubmitSchema.safeParse({
    description: formData.get("description"),
    category_id: (formData.get("category_id") as string) || null,
    budget_min: formData.get("budget_min"),
    budget_max: formData.get("budget_max"),
    location: formData.get("location"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    code: String(formData.get("code") ?? "").trim(),
    is_priority: formData.get("is_priority") === "true" || formData.get("is_priority") === "on",
    priority_amount: formData.get("priority_amount") || undefined,
    terms: formData.get("terms") === "on" || formData.get("terms") === "true",
  });
  if (!parsed.success) return { ok: false, error: "Some fields are missing or invalid." };
  if (parsed.data.budget_max < parsed.data.budget_min) return { ok: false, error: "Budget max must be >= min." };
  if (!parsed.data.terms) return { ok: false, error: "Please accept the terms to continue." };

  const sb = supabaseAdmin();

  // Verify the email code
  const { data: row } = await sb
    .from("order_email_verifications")
    .select("id, code_hash, expires_at, consumed_at, attempts")
    .eq("email", parsed.data.email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false, error: "Verification code expired. Request a new one." };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: "Verification code expired." };
  if (row.attempts >= PIN_MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Request a new code." };

  const ok = await verifyPin(parsed.data.code, row.code_hash);
  if (!ok) {
    await sb.from("order_email_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return { ok: false, error: "Wrong code. Try again." };
  }
  await sb.from("order_email_verifications").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  // Compute unlock cost (decimals)
  const settings = await getSettings();
  const unlockCredits = unlockCreditsFor(parsed.data.budget_max, settings.unlock_rate || 0.00001);

  const wantPriority = !!parsed.data.is_priority && parsed.data.budget_max > 1_000_000;
  const priorityAmount = wantPriority ? parsed.data.priority_amount ?? 0 : 0;

  const baseRow: Record<string, any> = {
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone,
    description: parsed.data.description,
    category_id: parsed.data.category_id ?? null,
    budget_min: parsed.data.budget_min,
    budget_max: parsed.data.budget_max,
    location: parsed.data.location,
    status: "submitted",
    unlock_credits: unlockCredits,
    unlocks_cap: UNLOCK_CAP_DEFAULT,
  };
  const extras: Record<string, any> = {
    is_priority: wantPriority,
    priority_amount_naira: wantPriority ? priorityAmount : null,
    terms_accepted_at: new Date().toISOString(),
  };

  let created: { id: string } | null = null;
  let lastErr: any = null;
  for (const row of [{ ...baseRow, ...extras }, baseRow]) {
    const { data, error } = await sb.from("lead_requests").insert(row).select("id").single();
    if (data) {
      created = data;
      break;
    }
    lastErr = error;
    // If a column missing on the first attempt, retry without the new extras.
    if (!error || !/column .* does not exist/i.test(String(error.message ?? ""))) break;
  }
  if (!created) {
    console.error("[order] insert failed:", lastErr?.message ?? lastErr);
    return { ok: false, error: `Couldn't save the request${lastErr?.message ? ` — ${lastErr.message}` : ""}.` };
  }

  // Attach uploaded image, if any
  const file = formData.get("image") as File | null;
  if (file && file instanceof File && file.size > 0 && file.size <= 5 * 1024 * 1024) {
    try {
      const ext = extensionOf(file, "jpg");
      const path = `requests/${created.id}/${randomUUID()}.${ext}`;
      const up = await uploadFile({ file, path });
      await sb.from("lead_request_images").insert({ request_id: created.id, url: up.publicUrl });
    } catch (e) {
      console.error("[order] image upload failed", e);
    }
  }

  // Remember the customer's email for "My requests" lookup
  cookies().set({
    name: "folio_order_email",
    value: parsed.data.email,
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // 180 days
    path: "/",
  });

  // Fire-and-forget transactional emails
  Promise.allSettled([
    sendOrderReceivedEmail(parsed.data.email, parsed.data.name),
    sendAdminNewRequestEmail(env.adminNotificationEmail(), {
      id: created.id,
      name: parsed.data.name,
      description: parsed.data.description,
      location: parsed.data.location,
    }),
  ]).catch(() => {});

  // If priority requested, kick off Paystack flow
  if (wantPriority && priorityAmount > 0) {
    try {
      const { initializeTransaction } = await import("@/lib/paystack");
      const { getOrigin } = await import("@/lib/originUrl");
      const reference = `priority_${created.id}`;
      await sb.from("lead_requests").update({ priority_reference: reference }).eq("id", created.id);
      const tx = await initializeTransaction({
        email: parsed.data.email,
        amount: priorityAmount * 100,
        currency: "NGN",
        callbackUrl: `${getOrigin()}/api/paystack/priority-callback`,
        reference,
        metadata: { kind: "priority_boost", request_id: created.id, amount: priorityAmount },
      });
      return { ok: true, id: created.id, priorityRedirect: tx.authorization_url };
    } catch (e) {
      // If init fails, just keep the request without priority paid.
      console.error("[order] priority init failed", e);
    }
  }

  return { ok: true, id: created.id };
}

// Auto-suggest matches (still used by admin approval)
export async function suggestMatches(requestId: string): Promise<{ suggested: number }> {
  const sb = supabaseAdmin();
  const { data: req } = await sb
    .from("lead_requests")
    .select("id, location, budget_min, budget_max, category_id")
    .eq("id", requestId)
    .single();
  if (!req) return { suggested: 0 };

  let q = sb
    .from("businesses")
    .select("id, business_categories!inner(category_id), business_locations(location), business_budget_ranges(budget_min, budget_max), wallets!inner(credits)")
    .eq("setup_complete", true)
    .gte("wallets.credits", MIN_NOTIFICATION_CREDITS);
  if (req.category_id) q = q.eq("business_categories.category_id", req.category_id);
  const { data: candidates } = await q;

  let suggested = 0;
  for (const m of (candidates ?? []) as any[]) {
    const locs = (m.business_locations ?? []).map((r: any) => r.location);
    if (locs.length > 0 && !locationsMatch(locs, req.location)) continue;
    const ranges = (m.business_budget_ranges ?? []) as { budget_min: number; budget_max: number }[];
    if (ranges.length > 0) {
      const ok = ranges.some((r) => r.budget_max >= req.budget_min && r.budget_min <= req.budget_max);
      if (!ok) continue;
    }
    const { error } = await sb
      .from("lead_notifications")
      .insert({ request_id: req.id, business_id: m.id, email_sent: false, added_by: "auto" });
    if (!error) suggested++;
  }
  return { suggested };
}

export async function sendPendingLeadEmails(requestId: string): Promise<{ sent: number }> {
  const sb = supabaseAdmin();
  const { data: req } = await sb
    .from("lead_requests")
    .select("id, location, budget_min, budget_max, unlock_credits, is_priority, priority_paid, categories(name)")
    .eq("id", requestId)
    .single();
  if (!req) return { sent: 0 };
  const industryName = (req as any).categories?.name ?? "your industry";
  const budgetStr = formatBudgetRange(req.budget_min, req.budget_max);
  const priorityFlag = !!req.is_priority && !!req.priority_paid;

  const { data: pending } = await sb
    .from("lead_notifications")
    .select("id, business_id, businesses(users(email))")
    .eq("request_id", requestId)
    .eq("email_sent", false);

  let sent = 0;
  for (const n of (pending ?? []) as any[]) {
    const email = n.businesses?.users?.email;
    if (!email) continue;
    try {
      await sendBusinessLeadEmail(email, {
        requestId,
        industryName,
        budget: budgetStr,
        location: req.location,
        unlockCredits: Number(req.unlock_credits),
        priority: priorityFlag,
      });
      await sb
        .from("lead_notifications")
        .update({ email_sent: true, sent_at: new Date().toISOString() })
        .eq("id", n.id);
      sent++;
    } catch {}
  }
  return { sent };
}
