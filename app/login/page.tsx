import Link from "next/link";
import { continueLoginAction } from "./actions";
import { FlowIllustration } from "@/lib/illustrations";
import { LogoMark } from "@/lib/logo";

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
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[400px] w-[400px] rounded-full bg-brand/30 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-24 h-[440px] w-[440px] rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slower" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 sm:py-12 lg:grid-cols-[1fr_1.05fr]">
        {/* Form column */}
        <div className="order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <LogoMark className="h-6 w-6" />
            Folio
          </Link>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
            <h1 className="text-2xl font-bold">Sign in or sign up</h1>
            {searchParams.new && (
              <p className="mt-3 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                Account created — enter your email to continue.
              </p>
            )}
            <p className="mt-2 text-sm text-white/65">Businesses only. We will email you a 4 digit code.</p>

            <form action={continueLoginAction} className="mt-5 space-y-3">
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                inputMode="email"
                defaultValue={searchParams.email}
                placeholder="you@business.com"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-brand/40"
              />
              <button className="w-full rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 px-4 py-3 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.7)] transition hover:shadow-[0_18px_40px_-10px_rgba(124,58,237,1)]">
                Continue
              </button>
            </form>

            {searchParams.error && (
              <p className="mt-3 text-sm text-rose-300">
                {errors[searchParams.error] ?? "Something went wrong. Try again."}
              </p>
            )}

            <p className="mt-6 text-sm text-white/60">
              Looking for a service instead?{" "}
              <Link href="/order" className="font-medium text-brand-light hover:text-white">Post a request</Link>
            </p>
          </div>
        </div>

        {/* Illustration column */}
        <div className="order-1 lg:order-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-light">How Folio works</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">From request to closed deal — in 3 simple steps.</h2>

            <div className="mt-5">
              <FlowIllustration small />
            </div>

            <ol className="mt-5 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">1</span>
                <div>
                  <p className="font-medium text-white">Customer posts</p>
                  <p className="text-white/65">A real request lands on Folio with budget and location.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">2</span>
                <div>
                  <p className="font-medium text-white">Folio matches</p>
                  <p className="text-white/65">Verified businesses in the right industry, area and budget get an email.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">3</span>
                <div>
                  <p className="font-medium text-white">You unlock and close</p>
                  <p className="text-white/65">Spend credits to reveal contact details. First come, first reveal — 10 unlocks per request.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
