"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BUDGET_PRESETS } from "@/lib/leads";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(sb: ReturnType<typeof supabaseAdmin>, base: string): Promise<string> {
  const root = base || `biz-${Math.random().toString(36).slice(2, 8)}`;
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const { data } = await sb.from("businesses").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function saveBusinessSetupAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const businessName = String(formData.get("business_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim() || businessName;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const cac = String(formData.get("cac_number") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const locationsRaw = String(formData.get("locations") ?? "");
  const locations = locationsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
  const categoryIds = formData.getAll("category").map(String).filter(Boolean).slice(0, 3);
  const budgetIdxs = formData.getAll("budget").map((s) => parseInt(String(s), 10)).filter((n) => Number.isInteger(n) && n >= 0 && n < BUDGET_PRESETS.length);

  if (!businessName || categoryIds.length === 0 || locations.length === 0 || budgetIdxs.length === 0) {
    redirect("/business/setup?error=1");
  }

  const sb = supabaseAdmin();
  const { data: existing } = await sb.from("businesses").select("id, slug").eq("user_id", session.userId).maybeSingle();

  let bizId: string;
  if (existing) {
    bizId = existing.id;
    await sb
      .from("businesses")
      .update({
        business_name: businessName,
        display_name: displayName,
        phone,
        cac_number: cac,
        bio,
        setup_complete: true,
      })
      .eq("id", bizId);
  } else {
    const slug = await uniqueSlug(sb, slugify(displayName));
    const { data: created, error } = await sb
      .from("businesses")
      .insert({
        user_id: session.userId,
        business_name: businessName,
        display_name: displayName,
        slug,
        phone,
        cac_number: cac,
        bio,
        setup_complete: true,
      })
      .select("id")
      .single();
    if (error || !created) redirect("/business/setup?error=1");
    bizId = created.id;
  }

  // Ensure wallet exists
  await sb.from("wallets").upsert({ user_id: session.userId }, { onConflict: "user_id", ignoreDuplicates: true });

  // Reset & write categories/locations/budgets
  await sb.from("business_categories").delete().eq("business_id", bizId);
  if (categoryIds.length) {
    await sb.from("business_categories").insert(categoryIds.map((category_id) => ({ business_id: bizId, category_id })));
  }
  await sb.from("business_locations").delete().eq("business_id", bizId);
  if (locations.length) {
    await sb.from("business_locations").insert(locations.map((location) => ({ business_id: bizId, location })));
  }
  await sb.from("business_budget_ranges").delete().eq("business_id", bizId);
  if (budgetIdxs.length) {
    await sb
      .from("business_budget_ranges")
      .insert(budgetIdxs.map((i) => ({ business_id: bizId, budget_min: BUDGET_PRESETS[i].min, budget_max: BUDGET_PRESETS[i].max })));
  }

  redirect("/dashboard");
}
