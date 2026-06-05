"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePin, hashPin, PIN_MAX_ATTEMPTS, PIN_TTL_MINUTES, verifyPin } from "@/lib/auth/pin";
import { sendPinEmail } from "@/lib/email/resend";
import { getUserSession } from "@/lib/auth/session";

const EmailSchema = z.object({ email: z.string().email() });
const VerifySchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/),
});

export async function sendPinAction(formData: FormData) {
  const parsed = EmailSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) redirect("/login?error=invalid_email");

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("id, email").eq("email", parsed.data.email).maybeSingle();
  if (!user) redirect("/login?error=unknown_email");

  const pin = generatePin();
  const pinHash = await hashPin(pin);
  const expiresAt = new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await sb.from("login_pins").insert({
    user_id: user.id,
    pin_hash: pinHash,
    expires_at: expiresAt,
  });
  if (error) redirect("/login?error=server");

  try {
    await sendPinEmail(user.email, pin);
  } catch {
    redirect("/login?error=email_failed");
  }

  redirect(`/login/verify?email=${encodeURIComponent(user.email)}`);
}

export async function verifyPinAction(formData: FormData) {
  const parsed = VerifySchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    pin: String(formData.get("pin") ?? "").trim(),
  });
  if (!parsed.success) redirect(`/login/verify?email=${encodeURIComponent(String(formData.get("email") ?? ""))}&error=invalid`);

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("id").eq("email", parsed.data.email).maybeSingle();
  if (!user) redirect("/login?error=unknown_email");

  const { data: pinRow } = await sb
    .from("login_pins")
    .select("id, pin_hash, expires_at, consumed_at, attempts")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pinRow) redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&error=expired`);
  if (new Date(pinRow.expires_at).getTime() < Date.now())
    redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&error=expired`);
  if (pinRow.attempts >= PIN_MAX_ATTEMPTS)
    redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&error=locked`);

  const ok = await verifyPin(parsed.data.pin, pinRow.pin_hash);
  if (!ok) {
    await sb.from("login_pins").update({ attempts: pinRow.attempts + 1 }).eq("id", pinRow.id);
    redirect(`/login/verify?email=${encodeURIComponent(parsed.data.email)}&error=wrong`);
  }

  await sb.from("login_pins").update({ consumed_at: new Date().toISOString() }).eq("id", pinRow.id);

  const session = await getUserSession();
  session.userId = user.id;
  await session.save();

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getUserSession();
  session.destroy();
  redirect("/");
}
