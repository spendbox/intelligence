"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "../login/actions";

type Item = { href: string; label: string };

const ITEMS: Item[] = [
  { href: "/business/discover", label: "Discover" },
  { href: "/business/wallet", label: "Wallet" },
  { href: "/business/profile", label: "My Page" },
  { href: "/business/leads", label: "Inbox" },
  { href: "/business/compliance", label: "Compliance" },
  { href: "/account/pin", label: "PIN" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function HeaderNavLinks({ credits }: { credits: number }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-full px-3 py-1.5 transition " +
              (active ? "bg-brand/10 font-semibold text-brand" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900")
            }
          >
            {item.label}
          </Link>
        );
      })}
      <Link href="/business/wallet" className="ml-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
        {credits.toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
      </Link>
      <form action={logoutAction}>
        <button className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          Sign out
        </button>
      </form>
    </nav>
  );
}

export function HeaderNavMobile({ credits }: { credits: number }) {
  const pathname = usePathname();
  return (
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
      <nav className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex flex-col p-2 text-sm">
          <div className="px-3 py-2 text-xs text-slate-500">
            Balance: <span className="font-semibold text-brand">{credits.toLocaleString(undefined, { maximumFractionDigits: 2 })} credits</span>
          </div>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "rounded-md px-3 py-2 transition " +
                  (active ? "bg-brand/10 font-semibold text-brand" : "text-slate-700 hover:bg-slate-50")
                }
              >
                {item.label}
              </Link>
            );
          })}
          <form action={logoutAction}>
            <button className="w-full rounded-md px-3 py-2 text-left text-slate-500 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </details>
  );
}
