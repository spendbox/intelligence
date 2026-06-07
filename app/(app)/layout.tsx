import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LogoMark } from "@/lib/logo";
import { HeaderNavLinks, HeaderNavMobile } from "./HeaderNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle();
  const credits = Number(wallet?.credits ?? 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <LogoMark className="h-6 w-6" />
            Folio
          </Link>
          <HeaderNavLinks credits={credits} />
          <HeaderNavMobile credits={credits} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
