import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { applyTopup } from "@/lib/wallet";

export const dynamic = "force-dynamic";

// Paystack webhook — guarantees we credit the wallet even when the user closes the
// browser before the callback URL fires. Configure this URL in Paystack dashboard.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", env.paystackSecret()).update(body).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event?.event !== "charge.success") return NextResponse.json({ ok: true, ignored: true });

  const reference: string = event.data?.reference;
  const metadata = event.data?.metadata ?? {};
  if (metadata?.kind !== "wallet_topup" || !reference) return NextResponse.json({ ok: true, ignored: true });

  const sb = supabaseAdmin();
  let userId: string | null = metadata.user_id ?? null;
  if (!userId && event.data?.customer?.email) {
    const { data: u } = await sb
      .from("users")
      .select("id")
      .eq("email", event.data.customer.email)
      .maybeSingle();
    userId = u?.id ?? null;
  }
  if (!userId) return NextResponse.json({ ok: false, error: "no_user" }, { status: 200 });

  const naira = Math.round(event.data.amount / 100);
  await applyTopup({ userId, naira, reference, source: "paystack" });
  return NextResponse.json({ ok: true });
}
