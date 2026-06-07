import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logoutAction } from "../login/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/business/leads", label: "Leads" },
  { href: "/business/wallet", label: "Wallet" },
  { href: "/business/profile", label: "My Page" },
  { href: "/business/compliance", label: "Compliance" },
  { href: "/account/pin", label: "PIN" },
];

function NavLinks({ className = "" }: { className?: string }) {
  return (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={`text-slate-700 hover:text-slate-900 ${className}`}>
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  const sb = supabaseAdmin();
  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId).maybeSingle();
  const credits = wallet?.credits ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-fuchsia-400" />
            Folio
          </Link>

          <nav className="hidden items-center gap-5 text-sm md:flex">
            <NavLinks />
            <Link href="/business/wallet" className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {credits.toLocaleString()} credits
            </Link>
            <form action={logoutAction}>
              <button className="text-slate-500 hover:text-slate-900">Sign out</button>
            </form>
          </nav>

          <details className="relative md:hidden">
            <summary className="rounded-md p-2 text-slate-700 hover:bg-slate-100" aria-label="Toggle menu">
              <svg className="menu-open-hide h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <svg className="menu-open-show h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </summary>
            <nav className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex flex-col p-2 text-sm">
                <div className="px-3 py-2 text-xs text-slate-500">
                  Balance: <span className="font-semibold text-brand">{credits.toLocaleString()} credits</span>
                </div>
                <NavLinks className="rounded-md px-3 py-2 hover:bg-slate-50" />
                <form action={logoutAction}>
                  <button className="w-full rounded-md px-3 py-2 text-left text-slate-500 hover:bg-slate-50">
                    Sign out
                  </button>
                </form>
              </div>
            </nav>
          </details>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
