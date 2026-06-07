"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { setSetting } from "@/lib/settings";

const Schema = z.object({
  paystack_enabled: z.coerce.boolean(),
  currency: z.string().min(3).max(8),
  price_monthly: z.coerce.number().min(0).finite(),
  price_yearly: z.coerce.number().min(0).finite(),
  naira_per_credit: z.coerce.number().int().min(1).max(1_000_000),
  unlock_rate: z.coerce.number().min(0).max(1).finite(),
});

function toMinorUnit(value: number): number {
  return Math.round(value * 100);
}

export async function saveSettingsAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");

  const parsed = Schema.safeParse({
    paystack_enabled: formData.get("paystack_enabled") === "on",
    currency: formData.get("currency") ?? "NGN",
    price_monthly: formData.get("price_monthly") ?? 0,
    price_yearly: formData.get("price_yearly") ?? 0,
    naira_per_credit: formData.get("naira_per_credit") ?? 10,
    unlock_rate: formData.get("unlock_rate") ?? 0.00001,
  });
  if (!parsed.success) redirect("/admin/settings?error=1");

  await Promise.all([
    setSetting("paystack_enabled", parsed.data.paystack_enabled),
    setSetting("currency", parsed.data.currency),
    setSetting("price_monthly_kobo", toMinorUnit(parsed.data.price_monthly)),
    setSetting("price_yearly_kobo", toMinorUnit(parsed.data.price_yearly)),
    setSetting("naira_per_credit", parsed.data.naira_per_credit),
    setSetting("unlock_rate", parsed.data.unlock_rate),
  ]);

  redirect("/admin/settings?saved=1");
}
