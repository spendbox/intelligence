import Link from "next/link";
import { signupAction } from "./signup/actions";

export const dynamic = "force-dynamic";

export default function HomePage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-10 sm:py-16">
        <header className="flex items-center justify-between">
          <span className="text-base font-semibold text-brand">Intelligence</span>
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Sign in
          </Link>
        </header>

        <section className="mt-12 flex-1 sm:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            For small businesses
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            The unfair advantage your business needs.
          </h1>
          <p className="mt-4 text-lg text-slate-600 sm:text-xl">
            Stay ahead of the competition. Get monthly business intelligence, hand-picked for the
            categories that matter to you.
          </p>

          <form action={signupAction} className="mt-8 space-y-3">
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@business.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.99]"
            >
              Start free trial
            </button>
            <p className="text-center text-xs text-slate-500">
              No card required. Yearly subscription coming soon.
            </p>
          </form>

          {searchParams.error && (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {searchParams.error === "invalid_email"
                ? "Please enter a valid email address."
                : "Something went wrong. Please try again."}
            </p>
          )}

          <ul className="mt-10 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2"><span className="text-brand">✓</span> Pick the categories that matter to your business.</li>
            <li className="flex gap-2"><span className="text-brand">✓</span> Get curated monthly insights to your inbox.</li>
            <li className="flex gap-2"><span className="text-brand">✓</span> Cancel anytime. Free during the trial.</li>
          </ul>
        </section>

        <footer className="mt-12 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Intelligence
        </footer>
      </div>
    </main>
  );
}
