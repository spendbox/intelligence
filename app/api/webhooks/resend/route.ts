import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Resend webhook event types we care about.
// https://resend.com/docs/dashboard/webhooks/event-types
const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.delivery_delayed": "queued",
  "email.failed": "failed",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = String((body as any).type ?? "");
  const messageId: string | undefined = (body as any).data?.email_id ?? (body as any).data?.id;
  const status = STATUS_MAP[type];
  if (!messageId || !status) return NextResponse.json({ ok: true, ignored: true });

  const sb = supabaseAdmin();
  await sb
    .from("email_deliveries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("resend_message_id", messageId);

  return NextResponse.json({ ok: true });
}
