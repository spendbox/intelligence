"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function saveProfileAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  await sb
    .from("businesses")
    .update({
      business_name: String(formData.get("business_name") ?? "").trim(),
      display_name: String(formData.get("display_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      cac_number: String(formData.get("cac_number") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
    })
    .eq("user_id", session.userId);

  redirect("/business/profile?saved=1");
}
