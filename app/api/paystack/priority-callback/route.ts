import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { getOrigin } from "@/lib/originUrl";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = getOrigin();
  const reference =
    req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${base}/order/done?priority=failed`);

  let v;
  try {
    v = await verifyTransaction(reference);
  } catch {
    return NextResponse.redirect(`${base}/order/done?priority=failed`);
  }

  if (v.status !== "success") return NextResponse.redirect(`${base}/order/done?priority=failed`);

  const requestId = (v.metadata as any)?.request_id as string | undefined;
  if (!requestId) return NextResponse.redirect(`${base}/order/done?priority=unknown`);

  const sb = supabaseAdmin();
  await sb
    .from("lead_requests")
    .update({
      priority_paid: true,
      priority_paid_at: new Date().toISOString(),
      priority_amount_naira: Math.round(v.amount / 100),
    })
    .eq("id", requestId);

  return NextResponse.redirect(`${base}/order/done?priority=success`);
}
