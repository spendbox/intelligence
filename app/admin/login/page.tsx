import { adminLoginAction } from "./actions";

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Internal use only.</p>
        <form action={adminLoginAction} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="admin@yourdomain.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand"
          />
          <button className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Sign in
          </button>
        </form>
        {searchParams.error && (
          <p className="mt-3 text-sm text-rose-600">Incorrect credentials.</p>
        )}
      </div>
    </main>
  );
}
