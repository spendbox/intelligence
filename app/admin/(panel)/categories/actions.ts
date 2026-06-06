"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(60),
  description: z.string().max(280).optional().nullable(),
});

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const parsed = CreateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: (formData.get("description") as string) || null,
  });
  if (!parsed.success) redirect("/admin/categories?error=invalid");

  const sb = supabaseAdmin();
  const { error } = await sb.from("categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    active: true,
  });
  if (error) {
    if (error.code === "23505") redirect("/admin/categories?error=slug_taken");
    redirect("/admin/categories?error=server");
  }
  redirect("/admin/categories?saved=1");
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/categories");
  const sb = supabaseAdmin();
  const { data } = await sb.from("categories").select("active").eq("id", id).single();
  if (data) {
    await sb.from("categories").update({ active: !data.active }).eq("id", id);
  }
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/categories");
  const sb = supabaseAdmin();
  // Block delete if any insight references this category — disable instead.
  const { count } = await sb
    .from("insight_drafts")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    await sb.from("categories").update({ active: false }).eq("id", id);
    redirect("/admin/categories?saved=1");
  }
  await sb.from("categories").delete().eq("id", id);
  redirect("/admin/categories?saved=1");
}
