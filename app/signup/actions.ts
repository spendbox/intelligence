"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const Schema = z.object({ email: z.string().email() });

export async function signupAction(formData: FormData) {
  const parsed = Schema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) redirect("/?error=invalid_email");

  const sb = supabaseAdmin();
  const trialEnds = new Date(Date.now() + env.trialDays() * 24 * 60 * 60 * 1000).toISOString();

  // Upsert: if the email already exists we just send them to /login.
  const { data: existing } = await sb.from("users").select("id").eq("email", parsed.data.email).maybeSingle();
  if (!existing) {
    const { error } = await sb.from("users").insert({
      email: parsed.data.email,
      trial_ends_at: trialEnds,
      status: "trialing",
    });
    if (error) redirect("/?error=signup_failed");
  }

  redirect(`/login?email=${encodeURIComponent(parsed.data.email)}&new=1`);
}
