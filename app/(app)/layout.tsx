import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { logoutAction } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-brand">
            Intelligence
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">Dashboard</Link>
            <Link href="/categories" className="text-slate-700 hover:text-slate-900">Categories</Link>
            <Link href="/subscription" className="text-slate-700 hover:text-slate-900">Subscription</Link>
            <form action={logoutAction}>
              <button className="text-slate-500 hover:text-slate-900">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
