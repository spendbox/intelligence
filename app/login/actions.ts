"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  generatePin,
  hashPin,
  PIN_MAX_ATTEMPTS,
  PIN_TTL_MINUTES,
  verifyPin,
} from "@/lib/auth/pin";
import { sendPinEmail } from "@/lib/email/resend";
import {
  getPinSetupSession,
  getUserSession,
  PIN_SETUP_MAX_AGE_MS,
} from "@/lib/auth/session";

const EmailSchema = z.object({ email: z.string().email() });
const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
const VerifyCodeSchema = z.object({ code: z.string().regex(/^\d{4}$/) });

async function loadUser(email: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id, email, pin_hash, first_login_at")
    .eq("email", email)
    .maybeSingle();
  return data;
}

async function startCodeFlow(userId: string, email: string, purpose: "setup" | "reset") {
  const sb = supabaseAdmin();
  const code = generatePin();
  const codeHash = await hashPin(code);
  await sb.from("login_pins").insert({
    user_id: userId,
    pin_hash: codeHash,
    expires_at: new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString(),
    purpose,
  });
  try {
    await sendPinEmail(email, code);
  } catch {
    redirect("/login?error=email_failed");
  }
}

// Step 1 — submit email. Routes to PIN entry or code setup depending on user state.
export async function continueLoginAction(formData: FormData) {
  const parsed = EmailSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) redirect("/login?error=invalid_email");

  const user = await loadUser(parsed.data.email);
  if (!user) redirect("/login?error=unknown_email");

  if (user.pin_hash) {
    redirect(`/login/pin?email=${encodeURIComponent(user.email)}`);
  }

  await startCodeFlow(user.id, user.email, "setup");
  redirect(`/login/setup?email=${encodeURIComponent(user.email)}`);
}

// Step 2A — user enters their saved PIN.
export async function signInWithPinAction(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsedEmail = EmailSchema.safeParse({ email: emailRaw });
  const parsedPin = PinSchema.safeParse({ pin: String(formData.get("pin") ?? "").trim() });
  if (!parsedEmail.success) redirect("/login?error=invalid_email");
  if (!parsedPin.success) {
    redirect(`/login/pin?email=${encodeURIComponent(emailRaw)}&error=invalid`);
  }

  const user = await loadUser(parsedEmail.data.email);
  if (!user || !user.pin_hash) redirect("/login?error=unknown_email");

  const ok = await verifyPin(parsedPin.data.pin, user.pin_hash);
  if (!ok) {
    redirect(`/login/pin?email=${encodeURIComponent(user.email)}&error=wrong`);
  }

  const session = await getUserSession();
  session.userId = user.id;
  await session.save();

  const sb = supabaseAdmin();
  const { count } = await sb
    .from("user_categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!user.first_login_at) {
    await sb.from("users").update({ first_login_at: new Date().toISOString() }).eq("id", user.id);
  }

  if ((count ?? 0) === 0) redirect("/categories?welcome=1");
  redirect("/dashboard");
}

// Step 2B — user clicks "Forgot PIN". Email a reset code.
export async function forgotPinAction(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = EmailSchema.safeParse({ email: emailRaw });
  if (!parsed.success) redirect("/login?error=invalid_email");

  const user = await loadUser(parsed.data.email);
  if (!user) redirect("/login?error=unknown_email");

  await startCodeFlow(user.id, user.email, "reset");
  redirect(`/login/setup?email=${encodeURIComponent(user.email)}&reset=1`);
}

// Step 3 — verify one-time code (setup / reset).
export async function verifySetupCodeAction(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsedEmail = EmailSchema.safeParse({ email: emailRaw });
  const parsedCode = VerifyCodeSchema.safeParse({ code: String(formData.get("code") ?? "").trim() });
  if (!parsedEmail.success || !parsedCode.success) {
    redirect(`/login/setup?email=${encodeURIComponent(emailRaw)}&error=invalid`);
  }

  const user = await loadUser(parsedEmail.data.email);
  if (!user) redirect("/login?error=unknown_email");

  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from("login_pins")
    .select("id, pin_hash, expires_at, consumed_at, attempts")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) redirect(`/login/setup?email=${encodeURIComponent(user.email)}&error=expired`);
  if (new Date(row.expires_at).getTime() < Date.now())
    redirect(`/login/setup?email=${encodeURIComponent(user.email)}&error=expired`);
  if (row.attempts >= PIN_MAX_ATTEMPTS)
    redirect(`/login/setup?email=${encodeURIComponent(user.email)}&error=locked`);

  const ok = await verifyPin(parsedCode.data.code, row.pin_hash);
  if (!ok) {
    await sb.from("login_pins").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    redirect(`/login/setup?email=${encodeURIComponent(user.email)}&error=wrong`);
  }

  await sb.from("login_pins").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  const setup = await getPinSetupSession();
  setup.email = user.email;
  setup.userId = user.id;
  setup.verifiedAt = Date.now();
  await setup.save();

  redirect(`/login/setup?email=${encodeURIComponent(user.email)}&stage=choose`);
}

// Step 4 — set a brand-new PIN after code verification.
export async function createPinAction(formData: FormData) {
  const setup = await getPinSetupSession();
  if (!setup.userId || !setup.email || !setup.verifiedAt) redirect("/login?error=expired");
  if (Date.now() - setup.verifiedAt > PIN_SETUP_MAX_AGE_MS) {
    setup.destroy();
    redirect("/login?error=expired");
  }

  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (!/^\d{4}$/.test(pin) || pin !== confirm) {
    redirect(`/login/setup?email=${encodeURIComponent(setup.email)}&stage=choose&error=mismatch`);
  }

  const pinHash = await hashPin(pin);
  const sb = supabaseAdmin();
  await sb.from("users").update({ pin_hash: pinHash }).eq("id", setup.userId);

  const userId = setup.userId;
  setup.destroy();

  const session = await getUserSession();
  session.userId = userId;
  await session.save();

  const { count } = await sb
    .from("user_categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!(await sb.from("users").select("first_login_at").eq("id", userId).single()).data?.first_login_at) {
    await sb.from("users").update({ first_login_at: new Date().toISOString() }).eq("id", userId);
  }
  if ((count ?? 0) === 0) redirect("/categories?welcome=1");
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getUserSession();
  session.destroy();
  redirect("/");
}
