import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  const base = env.appUrl();
  if (!reference) return NextResponse.redirect(`${base}/subscription?status=failed`);

  const sb = supabaseAdmin();
  const { data: payment } = await sb
    .from("payments")
    .select("id, user_id, plan, status")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return NextResponse.redirect(`${base}/subscription?status=failed`);

  try {
    const v = await verifyTransaction(reference);
    if (v.status !== "success") {
      await sb.from("payments").update({ status: v.status === "abandoned" ? "abandoned" : "failed" }).eq("id", payment.id);
      return NextResponse.redirect(`${base}/subscription?status=failed`);
    }

    const days = payment.plan === "yearly" ? 365 : 30;
    const { data: user } = await sb.from("users").select("subscription_ends_at").eq("id", payment.user_id).single();
    const current = user?.subscription_ends_at ? new Date(user.subscription_ends_at) : new Date();
    const startFrom = current > new Date() ? current : new Date();
    const newEnd = new Date(startFrom.getTime() + days * 24 * 60 * 60 * 1000);

    await sb
      .from("users")
      .update({
        status: "active",
        subscription_plan: payment.plan,
        subscription_ends_at: newEnd.toISOString(),
      })
      .eq("id", payment.user_id);

    await sb
      .from("payments")
      .update({ status: "success", verified_at: new Date().toISOString() })
      .eq("id", payment.id);

    return NextResponse.redirect(`${base}/subscription?status=success`);
  } catch {
    return NextResponse.redirect(`${base}/subscription?status=failed`);
  }
}
