"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { initializeTransaction } from "@/lib/paystack";
import { env } from "@/lib/env";

const Schema = z.object({ plan: z.enum(["monthly", "yearly"]) });

export async function startCheckoutAction(formData: FormData) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const parsed = Schema.safeParse({ plan: formData.get("plan") });
  if (!parsed.success) redirect("/subscription?status=failed");

  const settings = await getSettings();
  if (!settings.paystack_enabled) redirect("/subscription");

  const sb = supabaseAdmin();
  const { data: user } = await sb.from("users").select("email").eq("id", session.userId).single();
  if (!user) redirect("/login");

  const amount =
    parsed.data.plan === "monthly" ? settings.price_monthly_kobo : settings.price_yearly_kobo;
  const reference = `folio_${Date.now()}_${randomBytes(6).toString("hex")}`;

  await sb.from("payments").insert({
    user_id: session.userId,
    reference,
    plan: parsed.data.plan,
    amount_kobo: amount,
    currency: settings.currency,
    status: "pending",
  });

  let authorizationUrl: string;
  try {
    const res = await initializeTransaction({
      email: user.email,
      amount,
      currency: settings.currency,
      callbackUrl: `${env.appUrl()}/api/paystack/callback`,
      reference,
      metadata: { user_id: session.userId, plan: parsed.data.plan },
    });
    authorizationUrl = res.authorization_url;
  } catch {
    await sb.from("payments").update({ status: "failed" }).eq("reference", reference);
    redirect("/subscription?status=failed");
  }

  redirect(authorizationUrl);
}
