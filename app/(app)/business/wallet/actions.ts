"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { initializeTransaction } from "@/lib/paystack";
import { env } from "@/lib/env";
import { TOPUP_MAX_NAIRA, TOPUP_MIN_NAIRA } from "@/lib/leads";

export async function startTopupAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const amount = parseInt(String(formData.get("amount") ?? "0"), 10);
  if (!Number.isFinite(amount) || amount < TOPUP_MIN_NAIRA || amount > TOPUP_MAX_NAIRA) {
    redirect("/business/wallet?status=failed");
  }

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("email").eq("id", session.userId).single();
  if (!user) redirect("/login");

  const reference = `wallet_${Date.now()}_${randomBytes(6).toString("hex")}`;

  let authorizationUrl: string;
  try {
    const res = await initializeTransaction({
      email: user.email,
      amount: amount * 100, // Paystack expects kobo
      currency: "NGN",
      callbackUrl: `${env.appUrl()}/api/paystack/wallet-callback`,
      reference,
      metadata: { user_id: session.userId, kind: "wallet_topup", naira: amount },
    });
    authorizationUrl = res.authorization_url;
  } catch {
    redirect("/business/wallet?status=failed");
  }

  redirect(authorizationUrl);
}
