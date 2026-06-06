import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { adminLogoutAction } from "../login/actions";

const items = [
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/deliveries", label: "Deliveries" },
  { href: "/admin/settings", label: "Settings" },
];

function NavLinks({ pill = false }: { pill?: boolean }) {
  const base = pill
    ? "rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
    : "rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white";
  return (
    <>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={base}>
          {i.label}
        </Link>
      ))}
    </>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/95 text-slate-100 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/admin/insights" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-fuchsia-400 shadow-[0_0_20px_rgba(124,58,237,0.55)]" />
            Folio
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-300">
              Admin
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLinks pill />
            <form action={adminLogoutAction} className="ml-2">
              <button className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white">
                Sign out
              </button>
            </form>
          </nav>

          <details className="relative md:hidden">
            <summary className="rounded-md p-2 text-slate-200 hover:bg-white/5" aria-label="Toggle menu">
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
            <nav className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-ink/95 p-1 shadow-2xl backdrop-blur">
              <div className="flex flex-col">
                <NavLinks />
                <form action={adminLogoutAction}>
                  <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white">
                    Sign out
                  </button>
                </form>
              </div>
            </nav>
          </details>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
