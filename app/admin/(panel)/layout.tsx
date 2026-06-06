import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { adminLogoutAction } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-slate-900 text-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin/insights" className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-fuchsia-400" />
            Folio · Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-5">
            <Link href="/admin/insights" className="hover:text-white">Insights</Link>
            <Link href="/admin/categories" className="hover:text-white">Categories</Link>
            <Link href="/admin/users" className="hover:text-white">Users</Link>
            <Link href="/admin/deliveries" className="hover:text-white">Deliveries</Link>
            <Link href="/admin/settings" className="hover:text-white">Settings</Link>
            <form action={adminLogoutAction}>
              <button className="text-slate-400 hover:text-white">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
