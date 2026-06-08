import Link from "next/link";
import { continueLoginAction } from "./actions";
import { LogoMark } from "@/lib/logo";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid_email: "Please enter a valid email address.",
  unknown_email: "We couldn't find that email. Sign up first.",
  email_failed: "We couldn't send the email. Please try again.",
  expired: "That session expired. Sign in again.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { email?: string; error?: string; new?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark className="h-6 w-6" />
          Folio
        </Link>
        <Link href="/order" className="text-sm text-slate-500 hover:text-slate-900">
          Post a request
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-16">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Sign in to discover leads
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          For businesses. We'll email you a 4-digit code.
        </p>

        <div className="mt-8 w-full max-w-sm">
          {searchParams.new && (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account created — enter your email to continue.
            </p>
          )}

          <form action={continueLoginAction} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              autoFocus
              defaultValue={searchParams.email}
              placeholder="you@business.com"
              className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-base shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <SubmitButton
              className="w-full rounded-full bg-brand px-4 py-3 text-base text-white hover:bg-brand-dark"
              pendingLabel="Sending code…"
            >
              Continue
            </SubmitButton>
          </form>

          {searchParams.error && (
            <p className="mt-3 text-center text-sm text-rose-600">
              {errors[searchParams.error] ?? "Something went wrong. Try again."}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Looking for a service instead?{" "}
            <Link href="/order" className="text-slate-600 underline hover:text-slate-900">
              Post a request
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-400 sm:px-8">
        <span>© {new Date().getFullYear()} Folio · </span>
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
      </footer>
    </main>
  );
}
