"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePin, hashPin, PIN_MAX_ATTEMPTS, PIN_TTL_MINUTES, verifyPin } from "@/lib/auth/pin";
import { sendBusinessLeadEmail, sendOrderReceivedEmail, sendOrderVerificationEmail, sendAdminNewRequestEmail } from "@/lib/email/leads";
import { env } from "@/lib/env";
import { locationsMatch, MIN_NOTIFICATION_CREDITS, computeUnlockCredits, UNLOCK_CAP_DEFAULT, formatBudgetRange } from "@/lib/leads";

const SuggestSchema = z.object({ description: z.string().min(5).max(2000) });

export async function suggestIndustryAction(formData: FormData): Promise<{ categoryId: string | null; categoryName: string | null }> {
  const parsed = SuggestSchema.safeParse({ description: formData.get("description") });
  if (!parsed.success) return { categoryId: null, categoryName: null };

  const sb = supabaseAdmin();
  const { data: cats } = await sb.from("categories").select("id, slug, name, description").eq("active", true);
  const choices = (cats ?? []).map((c) => `${c.slug}: ${c.name}${c.description ? " — " + c.description : ""}`).join("\n");

  if (!env.openaiKeySafe()) {
    // Fallback: simple keyword scoring
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
});

export async function submitOrderAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
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
  });
  if (!parsed.success) return { ok: false, error: "Some fields are missing or invalid." };
  if (parsed.data.budget_max < parsed.data.budget_min) return { ok: false, error: "Budget max must be >= min." };

  const sb = supabaseAdmin();

  // Verify code
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

  // Create request
  const unlockCredits = await computeUnlockCredits(parsed.data.budget_max);
  const { data: created, error } = await sb
    .from("lead_requests")
    .insert({
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
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false, error: "Couldn't save the request." };

  // Fire-and-forget emails
  Promise.allSettled([
    sendOrderReceivedEmail(parsed.data.email, parsed.data.name),
    sendAdminNewRequestEmail(env.adminNotificationEmail(), {
      id: created.id,
      name: parsed.data.name,
      description: parsed.data.description,
      location: parsed.data.location,
    }),
  ]).catch(() => {});

  return { ok: true, id: created.id };
}

// Used by admin matching after approval
export async function matchAndNotifyBusinesses(requestId: string) {
  const sb = supabaseAdmin();
  const { data: req } = await sb
    .from("lead_requests")
    .select("id, location, budget_min, budget_max, category_id, unlock_credits, categories(name)")
    .eq("id", requestId)
    .single();
  if (!req) return { notified: 0 };

  let q = sb
    .from("businesses")
    .select("id, user_id, users!inner(email), business_categories!inner(category_id), business_locations(location), business_budget_ranges(budget_min, budget_max), wallets!inner(credits)")
    .eq("setup_complete", true)
    .gte("wallets.credits", MIN_NOTIFICATION_CREDITS);
  if (req.category_id) q = q.eq("business_categories.category_id", req.category_id);
  const { data: matches } = await q;

  const industryName = (req as any).categories?.name ?? "your industry";
  const budgetStr = formatBudgetRange(req.budget_min, req.budget_max);
  let notified = 0;

  for (const m of (matches ?? []) as any[]) {
    const locs = (m.business_locations ?? []).map((r: any) => r.location);
    if (locs.length > 0 && !locationsMatch(locs, req.location)) continue;
    const ranges = (m.business_budget_ranges ?? []) as { budget_min: number; budget_max: number }[];
    if (ranges.length > 0) {
      const ok = ranges.some((r) => r.budget_max >= req.budget_min && r.budget_min <= req.budget_max);
      if (!ok) continue;
    }

    const { error: insErr } = await sb
      .from("lead_notifications")
      .insert({ request_id: req.id, business_id: m.id });
    if (insErr) continue; // already notified

    try {
      await sendBusinessLeadEmail(m.users.email, {
        requestId: req.id,
        industryName,
        budget: budgetStr,
        location: req.location,
        unlockCredits: req.unlock_credits,
      });
      notified++;
    } catch {}
  }
  return { notified };
}
