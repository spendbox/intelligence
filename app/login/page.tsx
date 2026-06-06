import Link from "next/link";
import { sendPinAction } from "./actions";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { email?: string; error?: string; new?: string };
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Sign in</h1>
          {searchParams.new && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Account created — enter your email to get a login code.
            </p>
          )}
          <p className="mt-2 text-sm text-slate-600">We'll email you a 4-digit code from <span className="font-medium">notifications@folio.cafe</span>.</p>

          <form action={sendPinAction} className="mt-5 space-y-3">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={searchParams.email}
              placeholder="you@business.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white hover:bg-brand-dark">
              Send code
            </button>
          </form>

          {searchParams.error && (
            <p className="mt-3 text-sm text-rose-600">
              {searchParams.error === "unknown_email"
                ? "We couldn't find that email. Sign up first."
                : "Something went wrong. Try again."}
            </p>
          )}

          <p className="mt-6 text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/" className="font-medium text-brand">Start a free trial</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
