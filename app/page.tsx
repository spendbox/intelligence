import Link from "next/link";
import { LogoMark } from "@/lib/logo";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  "Wedding photographer in Lagos",
  "3-bedroom rental in Lekki",
  "Catering for 80 in Abuja",
  "Bulk poultry feed in Ogun",
  "Custom CRM for fintech",
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Top bar — minimal */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark className="h-6 w-6" />
          Folio
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/orders" className="text-slate-500 hover:text-slate-900">My requests</Link>
          <Link
            href="/login"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Centered search */}
      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-16">
        <LogoMark className="h-12 w-12 sm:h-16 sm:w-16" />
        <h1 className="mt-5 bg-gradient-to-r from-brand via-fuchsia-500 to-rose-400 bg-clip-text text-center text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Find leads anywhere on the web.
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm text-slate-500 sm:text-base">
          Type what you're looking for. Folio searches the public web — classifieds,
          job boards, callouts, posts — and brings back the matches.
        </p>

        <form action="/api/start-search" method="get" className="mt-8 w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-md focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-slate-400">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              autoFocus
              placeholder="What kind of lead are you looking for?"
              className="flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-slate-400"
              maxLength={240}
            />
            <button
              type="submit"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Discover
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((s) => (
              <Link
                key={s}
                href={`/api/start-search?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-brand/40 hover:text-brand"
              >
                {s}
              </Link>
            ))}
          </div>
        </form>

        <div className="mt-10 text-center text-xs text-slate-400">
          Looking for a service yourself?{" "}
          <Link href="/order" className="text-slate-600 underline hover:text-slate-900">
            Post a request
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-400 sm:px-8">
        <span>© {new Date().getFullYear()} Folio · </span>
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        <span> · </span>
        <Link href="/login" className="hover:text-slate-600">Sign in</Link>
      </footer>
    </main>
  );
}
