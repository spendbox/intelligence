import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The business dashboard is now the Discover surface. Send signed-in
// businesses straight there; unsigned users to login, and incomplete
// businesses through setup first.
export default async function DashboardPage() {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("setup_complete")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!business || !business.setup_complete) redirect("/business/setup");

  redirect("/business/discover");
}
