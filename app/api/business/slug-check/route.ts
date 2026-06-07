import { NextResponse, type NextRequest } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session.userId) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const slug = (req.nextUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!slug || slug.length < 3 || slug.length > 60 || !SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: true, available: false, reason: "format" });
  }

  const sb = supabaseAdmin();
  const { data: ownBiz } = await sb.from("businesses").select("id, slug").eq("user_id", session.userId).maybeSingle();
  if (ownBiz?.slug === slug) {
    return NextResponse.json({ ok: true, available: true, own: true });
  }

  const { data: taken } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
  return NextResponse.json({ ok: true, available: !taken });
}
