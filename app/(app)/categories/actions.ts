"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function saveCategoriesAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const ids = formData.getAll("category").map(String).filter(Boolean);
  const sb = supabaseAdmin();

  await sb.from("user_categories").delete().eq("user_id", session.userId);
  if (ids.length > 0) {
    await sb
      .from("user_categories")
      .insert(ids.map((category_id) => ({ user_id: session.userId!, category_id })));
  }

  redirect("/categories?saved=1");
}
