import { LogoMark } from "@/lib/logo";
import { SubmitButton } from "@/components/SubmitButton";
import { adminLoginAction } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen bg-ink px-5 py-16 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <LogoMark className="h-6 w-6" />
          Folio
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-300">Admin</span>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
          <h1 className="text-2xl font-bold">Admin sign in</h1>
          <p className="mt-2 text-sm text-white/65">Internal use only.</p>
          <form action={adminLoginAction} className="mt-5 space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="admin@yourdomain.com"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-brand/40"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-brand/40"
            />
            <SubmitButton
              className="w-full bg-gradient-to-br from-brand to-fuchsia-500 px-4 py-3 text-base shadow-[0_10px_30px_-10px_rgba(124,58,237,0.7)]"
              pendingLabel="Signing in…"
            >
              Sign in
            </SubmitButton>
          </form>
          {searchParams.error && (
            <p className="mt-3 text-sm text-rose-300">Incorrect credentials.</p>
          )}
        </div>
      </div>
    </main>
  );
}
