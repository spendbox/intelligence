"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePin, hashPin, PIN_TTL_MINUTES, verifyPin } from "@/lib/auth/pin";
import { sendPinEmail } from "@/lib/email/resend";

export async function changePinAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const current = String(formData.get("current") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (!/^\d{4}$/.test(pin) || !/^\d{4}$/.test(current)) redirect("/account/pin?error=invalid");
  if (pin !== confirm) redirect("/account/pin?error=mismatch");

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("pin_hash").eq("id", session.userId).single();
  if (!user?.pin_hash) redirect("/account/pin?error=invalid");

  const ok = await verifyPin(current, user.pin_hash);
  if (!ok) redirect("/account/pin?error=wrong");

  const newHash = await hashPin(pin);
  await sb.from("users").update({ pin_hash: newHash }).eq("id", session.userId);
  redirect("/account/pin?saved=1");
}

export async function sendResetCodeAction() {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("id, email").eq("id", session.userId).single();
  if (!user) redirect("/login");

  const code = generatePin();
  const codeHash = await hashPin(code);
  await sb.from("login_pins").insert({
    user_id: user.id,
    pin_hash: codeHash,
    expires_at: new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString(),
    purpose: "reset",
  });
  await sendPinEmail(user.email, code);

  session.destroy();
  redirect(`/login/setup?email=${encodeURIComponent(user.email)}&reset=1`);
}
