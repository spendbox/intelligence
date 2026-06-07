import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IndustryIcon } from "@/lib/industryIcons";

export const dynamic = "force-dynamic";

const EXAMPLE_INSIGHTS = [
  { tag: "Real Estate", title: "3 emerging neighborhoods up 18% in rental demand" },
  { tag: "E-commerce", title: "5 product categories quietly outperforming this quarter" },
  { tag: "Food", title: "How a 2-item menu cut delivery costs by 30%" },
  { tag: "Tech & SaaS", title: "The pricing tweak that lifts MRR by 12%" },
  { tag: "Education", title: "7 partnerships parents asked for last month" },
  { tag: "Health", title: "Insurance changes you should act on this month" },
  { tag: "Fashion", title: "Trends moving 4x faster on TikTok than Instagram" },
  { tag: "Logistics", title: "Routes where fuel costs dropped 22%" },
  { tag: "Finance", title: "Lending terms tightening — what to do before Q4" },
  { tag: "Agriculture", title: "Buyers paying premiums for these 3 categories" },
];

const VALUE_PROPS = [
  { title: "Actionable insights", body: "Hand-picked, decision-grade information for your industry — never filler." },
  { title: "New business ideas", body: "Two fresh opportunities you can test in the next 30 days, every month." },
  { title: "Cut your costs", body: "Specific ways operators in your space are reducing expenses right now." },
  { title: "Improve your profit", body: "Pricing, retention and upsell tactics tested by businesses like yours." },
  { title: "Customer leads", body: "Real outreach scripts and example customer emails you can copy and send." },
  { title: "Built for time-poor founders", body: "Up to 10 insights, once a month, scannable in 5 minutes." },
];

async function loadIndustries() {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("categories")
      .select("slug, name, description")
      .eq("active", true)
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage({ searchParams }: { searchParams: { error?: string } }) {
  const industries = await loadIndustries();
  const marqueeList = [...EXAMPLE_INSIGHTS, ...EXAMPLE_INSIGHTS];

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-brand/40 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-fuchsia-500/30 blur-3xl animate-float-slower" />
        <div className="absolute -bottom-32 left-1/4 h-[380px] w-[380px] rounded-full bg-indigo-500/30 blur-3xl animate-float-slow" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col px-5 py-8 sm:py-12">
        {/* Header */}
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

        {/* Hero */}
        <section className="mt-14 sm:mt-20">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
            </span>
            Built for small businesses
          </div>

          <h1 className="animate-fade-up delay-100 mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Get the leads.{" "}
            <span className="bg-gradient-to-r from-brand-light via-fuchsia-300 to-rose-200 bg-clip-text text-transparent animate-shimmer">
              Close the business.
            </span>
          </h1>

          <p className="animate-fade-up delay-200 mt-5 max-w-xl text-lg text-white/70 sm:text-xl">
            Folio is where customers post what they need — and trusted businesses in their industry, area and budget reach out directly.
          </p>

          <div className="animate-fade-up delay-300 mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/order"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-fuchsia-500 p-5 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)] transition hover:shadow-[0_18px_40px_-10px_rgba(124,58,237,1)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Looking for a service?</p>
              <p className="mt-2 text-lg font-bold text-white">Post a request →</p>
              <p className="mt-1 text-sm text-white/80">Free. Tell us what you need, get matched with vetted businesses.</p>
            </Link>
            <Link
              href="/login"
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition hover:bg-white/10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Run a business?</p>
              <p className="mt-2 text-lg font-bold text-white">Get leads →</p>
              <p className="mt-1 text-sm text-white/60">Sign up free. Unlock contact details with credits when leads match.</p>
            </Link>
          </div>

          {searchParams.error && (
            <p className="animate-fade-up mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {searchParams.error === "invalid_email"
                ? "Please enter a valid email address."
                : "Something went wrong. Please try again."}
            </p>
          )}
        </section>

        {/* Insight examples marquee */}
        <section className="animate-fade-up delay-500 mt-16">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
              What lands in your inbox
            </h2>
            <span className="text-xs text-white/40">Examples</span>
          </div>
          <div className="relative mt-3 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-ink to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-ink to-transparent" />
            <div className="flex w-max gap-3 animate-marquee">
              {marqueeList.map((ex, i) => (
                <article
                  key={i}
                  className="w-72 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light">{ex.tag}</p>
                  <p className="mt-2 text-sm font-medium leading-snug text-white">{ex.title}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">More than a newsletter.</h2>
          <p className="mt-2 max-w-xl text-white/60">
            Every month you get more than insights. You get the moves that save you money and grow you.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {VALUE_PROPS.map((v) => (
              <li
                key={v.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-semibold text-white">{v.title}</p>
                <p className="mt-1 text-sm text-white/60">{v.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Industries */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Pick your industry.</h2>
          <p className="mt-2 max-w-xl text-white/60">
            Folio is built around the industry you actually operate in. Subscribe to as many as you'd like.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.length === 0 ? (
              <li className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                Industries are loading…
              </li>
            ) : (
              industries.map((c: any) => (
                <li
                  key={c.slug}
                  className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-fuchsia-500/20 text-brand-light ring-1 ring-white/10">
                    <IndustryIcon slug={c.slug} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{c.description}</p>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="mt-8 flex flex-col items-start gap-2">
            <Link
              href="/order"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition hover:bg-white/90"
            >
              Post your request — it's free →
            </Link>
            <p className="text-xs text-white/40">No account needed. Email-verified in under a minute.</p>
          </div>
        </section>

        <footer className="mt-20 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Folio</span>
          <span>folio.cafe</span>
        </footer>
      </div>
    </main>
  );
}
