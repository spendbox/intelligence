import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { dispatchInsight } from "@/app/admin/(panel)/insights/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: due } = await sb
    .from("insight_drafts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(20);

  const ids = (due ?? []).map((d) => d.id);
  for (const id of ids) {
    await dispatchInsight(id);
  }

  return NextResponse.json({ ok: true, dispatched: ids.length });
}
