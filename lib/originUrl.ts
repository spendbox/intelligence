import { headers } from "next/headers";
import { env } from "@/lib/env";

// Derive the public origin from request headers (preferred) or APP_URL env fallback.
// Works in server actions and route handlers. Saves us when APP_URL hasn't been
// configured in Vercel yet — Paystack callbacks otherwise redirect to localhost.
export function getOrigin(): string {
  try {
    const h = headers();
    const fwdHost = h.get("x-forwarded-host") ?? h.get("host");
    const fwdProto = h.get("x-forwarded-proto") ?? (fwdHost?.includes("localhost") ? "http" : "https");
    if (fwdHost) return `${fwdProto}://${fwdHost}`;
  } catch {}
  return env.appUrl();
}
