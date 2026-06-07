import { supabaseAdmin } from "@/lib/supabase/server";

export type Settings = {
  paystack_enabled: boolean;
  price_monthly_kobo: number;
  price_yearly_kobo: number;
  currency: string;
  naira_per_credit: number;
  unlock_rate: number;
};

const defaults: Settings = {
  paystack_enabled: false,
  price_monthly_kobo: 500000,
  price_yearly_kobo: 5000000,
  currency: "NGN",
  naira_per_credit: 10,
  unlock_rate: 0.00001,
};

export async function getSettings(): Promise<Settings> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("app_settings").select("key, value");
  const out: Settings = { ...defaults };
  for (const row of data ?? []) {
    if (row.key in out) {
      (out as any)[row.key] = row.value;
    }
  }
  return out;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  const sb = supabaseAdmin();
  await sb
    .from("app_settings")
    .upsert({ key, value: value as any, updated_at: new Date().toISOString() });
}
