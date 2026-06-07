// Paystack: minimal redirect-based "Standard" flow.
// Docs: https://paystack.com/docs/api/transaction
import { env } from "@/lib/env";

const BASE = "https://api.paystack.co";

export type InitArgs = {
  email: string;
  amount: number; // kobo
  currency?: string;
  callbackUrl: string;
  reference: string;
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(args: InitArgs): Promise<{ authorization_url: string; reference: string }> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amount,
      currency: args.currency ?? "NGN",
      callback_url: args.callbackUrl,
      reference: args.reference,
      metadata: args.metadata ?? {},
    }),
    cache: "no-store",
  });
  const json: any = await res.json();
  if (!res.ok || !json?.status) {
    throw new Error(`Paystack init failed: ${json?.message ?? res.statusText}`);
  }
  return { authorization_url: json.data.authorization_url, reference: json.data.reference };
}

export async function verifyTransaction(reference: string): Promise<{
  status: "success" | "failed" | "abandoned" | "pending";
  amount: number;
  currency: string;
  customer?: { email?: string; customer_code?: string };
  metadata?: Record<string, any>;
}> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.paystackSecret()}` },
    cache: "no-store",
  });
  const json: any = await res.json();
  if (!res.ok || !json?.status) {
    throw new Error(`Paystack verify failed: ${json?.message ?? res.statusText}`);
  }
  const data = json.data;
  const status: any = data.status === "success" ? "success" : data.status;
  return {
    status,
    amount: data.amount,
    currency: data.currency,
    customer: { email: data.customer?.email, customer_code: data.customer?.customer_code },
    metadata: data.metadata ?? undefined,
  };
}
