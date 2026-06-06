import Link from "next/link";
import { signupAction } from "./signup/actions";

export const dynamic = "force-dynamic";

export default function HomePage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      {/* Animated background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-brand/40 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-fuchsia-500/30 blur-3xl animate-float-slower" />
        <div className="absolute -bottom-32 left-1/4 h-[380px] w-[380px] rounded-full bg-indigo-500/30 blur-3xl animate-float-slow" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8 sm:max-w-2xl sm:py-12">
        <header className="flex items-center justify-between animate-fade-in">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-brand to-fuchsia-400 shadow-[0_0_20px_rgba(124,58,237,0.6)]" />
            Folio
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
          >
            Sign in
          </Link>
        </header>

        <section className="mt-14 flex-1 sm:mt-20">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
            </span>
            Built for small businesses
          </div>

          <h1 className="animate-fade-up delay-100 mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            The unfair advantage{" "}
            <span className="bg-gradient-to-r from-brand-light via-fuchsia-300 to-rose-200 bg-clip-text text-transparent animate-shimmer">
              your business needs
            </span>
            .
          </h1>

          <p className="animate-fade-up delay-200 mt-5 max-w-lg text-lg text-white/70 sm:text-xl">
            Stay ahead of the competition. Get monthly business intelligence hand-picked for the
            categories that matter to you.
          </p>

          <form
            action={signupAction}
            className="animate-fade-up delay-300 mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-md sm:p-2"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="you@business.com"
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none ring-0 transition focus:bg-white/10"
              />
              <button
                type="submit"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 px-5 py-3 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)] transition hover:shadow-[0_18px_40px_-10px_rgba(124,58,237,1)] active:scale-[0.99]"
              >
                <span className="relative z-10">Start free trial →</span>
                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
              </button>
            </div>
            <p className="mt-2 px-2 text-center text-xs text-white/50 sm:text-left">
              No card required. Yearly subscription coming soon.
            </p>
          </form>

          {searchParams.error && (
            <p className="animate-fade-up mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {searchParams.error === "invalid_email"
                ? "Please enter a valid email address."
                : "Something went wrong. Please try again."}
            </p>
          )}

          <ul className="animate-fade-up delay-500 mt-12 grid gap-3 sm:grid-cols-3">
            {[
              { title: "Curated", body: "Insights chosen for your selected categories." },
              { title: "Monthly", body: "Delivered to your inbox on a schedule." },
              { title: "Actionable", body: "Built to inform decisions, not fill feeds." },
            ].map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-sm text-white/60">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="animate-fade-in delay-700 mt-14 flex items-center justify-between text-xs text-white/40">
          <span>© {new Date().getFullYear()} Folio</span>
          <span>folio.cafe</span>
        </footer>
      </div>
    </main>
  );
}
