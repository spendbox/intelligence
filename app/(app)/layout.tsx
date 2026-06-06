import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { logoutAction } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-fuchsia-400" />
            Folio
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-5">
            <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">Dashboard</Link>
            <Link href="/categories" className="text-slate-700 hover:text-slate-900">Categories</Link>
            <Link href="/subscription" className="text-slate-700 hover:text-slate-900">Plan</Link>
            <form action={logoutAction}>
              <button className="text-slate-500 hover:text-slate-900">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
    </div>
  );
}
