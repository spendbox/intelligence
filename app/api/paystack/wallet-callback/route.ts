import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { applyTopup } from "@/lib/wallet";
import { getOrigin } from "@/lib/originUrl";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = getOrigin();
  const reference =
    req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${base}/business/wallet?status=failed&reason=noref`);

  let v;
  try {
    v = await verifyTransaction(reference);
  } catch (e: any) {
    console.error("[wallet-callback] verify failed", reference, e?.message);
    return NextResponse.redirect(`${base}/business/wallet?status=failed&reason=verify`);
  }
  if (v.status !== "success") {
    return NextResponse.redirect(`${base}/business/wallet?status=failed&reason=status`);
  }

  const sb = supabaseAdmin();
  let userId: string | null = (v.metadata as any)?.user_id ?? null;
  if (!userId && v.customer?.email) {
    const { data: u } = await sb
      .from("users")
      .select("id")
      .eq("email", v.customer.email)
      .maybeSingle();
    userId = u?.id ?? null;
  }
  if (!userId) {
    console.error("[wallet-callback] no user resolved", { reference, email: v.customer?.email });
    return NextResponse.redirect(`${base}/business/wallet?status=failed&reason=nouser`);
  }

  const naira = Math.round(v.amount / 100);
  const result = await applyTopup({ userId, naira, reference, source: "paystack" });
  if (!result.ok) {
    return NextResponse.redirect(`${base}/business/wallet?status=failed&reason=apply`);
  }

  return NextResponse.redirect(`${base}/dashboard?topup=success&amount=${naira}`);
}
