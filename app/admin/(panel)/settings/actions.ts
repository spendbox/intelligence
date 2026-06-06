"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { setSetting } from "@/lib/settings";

const Schema = z.object({
  paystack_enabled: z.coerce.boolean(),
  currency: z.string().min(3).max(8),
  price_monthly_kobo: z.coerce.number().int().min(0),
  price_yearly_kobo: z.coerce.number().int().min(0),
});

export async function saveSettingsAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");

  const parsed = Schema.safeParse({
    paystack_enabled: formData.get("paystack_enabled") === "on",
    currency: formData.get("currency") ?? "NGN",
    price_monthly_kobo: formData.get("price_monthly_kobo") ?? 0,
    price_yearly_kobo: formData.get("price_yearly_kobo") ?? 0,
  });
  if (!parsed.success) redirect("/admin/settings");

  await Promise.all([
    setSetting("paystack_enabled", parsed.data.paystack_enabled),
    setSetting("currency", parsed.data.currency),
    setSetting("price_monthly_kobo", parsed.data.price_monthly_kobo),
    setSetting("price_yearly_kobo", parsed.data.price_yearly_kobo),
  ]);

  redirect("/admin/settings?saved=1");
}
