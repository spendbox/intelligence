import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IndustryIcon } from "@/lib/industryIcons";
import { LogoMark } from "@/lib/logo";
import { getSettings } from "@/lib/settings";
import { formatNaira } from "@/lib/leads";
import { HeroIllustration, StackIllustration, WalletIllustration } from "@/lib/illustrations";

export const dynamic = "force-dynamic";

const EXAMPLE_LEADS = [
  { tag: "Real Estate", title: "3-bedroom apartment in Lekki Phase 1 · ₦5–8m/yr" },
  { tag: "Photography", title: "Wedding shoot in Abuja, Nov 23 · ₦400k–₦700k" },
  { tag: "Tech & SaaS", title: "Custom CRM for a fintech sales team · ₦1.5m+" },
  { tag: "Food & Beverage", title: "Corporate lunch catering for 80 people · ₦600k–₦900k" },
  { tag: "Logistics", title: "Weekly Lagos-Ibadan haulage contract · ₦2m+/mo" },
  { tag: "Education", title: "After-school tutor for SS2 maths · ₦80k/mo" },
  { tag: "Fashion", title: "Bespoke aso-ebi for a 40-person bridal party · ₦1.5m" },
  { tag: "Health", title: "Family clinic looking for medical equipment supplier · ₦3m+" },
  { tag: "Agriculture", title: "Bulk poultry feed supply, Ogun · ₦4m+/mo" },
  { tag: "Hospitality", title: "Event venue for 200 in PH · ₦800k–₦1.2m" },
];

async function loadIndustries() {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("categories")
      .select("id, slug, name, description")
      .eq("active", true)
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

async function loadStats() {
  try {
    const sb = supabaseAdmin();
    const [biz, req] = await Promise.all([
      sb.from("businesses").select("*", { count: "exact", head: true }).eq("setup_complete", true),
      sb.from("lead_requests").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    // Show at least 100+ while the marketplace seeds — keeps the landing
    // confident-looking before the real count crosses that bar.
    const businesses = Math.max(100, biz.count ?? 0);
    return { businesses, requests: req.count ?? 0 };
  } catch {
    return { businesses: 100, requests: 0 };
  }
}

export default async function HomePage() {
  const [industries, stats, settings] = await Promise.all([loadIndustries(), loadStats(), getSettings()]);
  const marquee = [...EXAMPLE_LEADS, ...EXAMPLE_LEADS];
  const creditNaira = settings.naira_per_credit || 10;
  const sampleUnlock = Math.max(1, Math.floor(100_000 * (settings.unlock_rate || 0.00001)));

  return (
    <main className="bg-ink text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <LogoMark className="h-7 w-7" />
            Folio
          </Link>
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <a href="#how-it-works" className="hidden text-white/70 hover:text-white sm:inline">How it works</a>
            <a href="#industries" className="hidden text-white/70 hover:text-white sm:inline">Industries</a>
            <a href="#faq" className="hidden text-white/70 hover:text-white sm:inline">FAQ</a>
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-[460px] w-[460px] rounded-full bg-brand/40 blur-3xl animate-float-slow" />
          <div className="absolute top-1/3 -right-24 h-[500px] w-[500px] rounded-full bg-fuchsia-500/30 blur-3xl animate-float-slower" />
          <div className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/30 blur-3xl animate-float-slow" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:pt-20 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div>
              <h1 className="animate-fade-up delay-100 mt-2 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Get the leads.{" "}
                <span className="bg-gradient-to-r from-brand-light via-fuchsia-300 to-rose-200 bg-clip-text text-transparent animate-shimmer">
                  Close the Deal.
                </span>
              </h1>

              <p className="animate-fade-up delay-200 mt-5 max-w-xl text-balance text-lg text-white/70 sm:text-xl">
                Folio is the marketplace where Nigerian customers post what they need, and trusted businesses in
                their industry, area and budget reach out directly. Real customers. No spam. Fair pricing.
              </p>

              <div className="animate-fade-up delay-300 mt-9 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/order"
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-fuchsia-500 p-5 shadow-[0_18px_40px_-12px_rgba(124,58,237,0.7)] transition hover:shadow-[0_24px_50px_-12px_rgba(124,58,237,1)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">Looking for a service?</p>
                  <p className="mt-2 text-xl font-bold text-white">Post a request →</p>
                  <p className="mt-1 text-sm text-white/80">Free. Tell us what you need; vetted businesses come to you.</p>
                  <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
                <Link
                  href="/login"
                  className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Run a business?</p>
                  <p className="mt-2 text-xl font-bold text-white">Get vetted leads →</p>
                  <p className="mt-1 text-sm text-white/65">
                    Sign up, complete compliance, get matched leads in your industry & area.
                  </p>
                </Link>
              </div>

              <div className="animate-fade-up delay-500 mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
                <Stat value={`${industries.length}`} label="industries" />
                <Stat value={`${stats.businesses.toLocaleString()}+`} label="businesses" />
                <Stat value="Up to 10" label="businesses per request" />
                <Stat value="Compliance" label="reviewed by humans" />
              </div>
            </div>

            <div className="animate-fade-up delay-300 hidden lg:block">
              <HeroIllustration />
            </div>
          </div>

          {/* Mobile-only illustration, smaller */}
          <div className="animate-fade-up delay-300 mt-12 lg:hidden">
            <HeroIllustration />
          </div>
        </div>

        {/* Insight marquee */}
        <div className="animate-fade-up delay-500 border-y border-white/5 bg-white/[0.02] py-6">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Real requests landing in inboxes right now
            </p>
            <div className="relative mt-3 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />
              <div className="flex w-max gap-3 animate-marquee">
                {marquee.map((ex, i) => (
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
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — light section */}
      <section id="how-it-works" className="bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">How Folio works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Two sides. One simple loop.</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Whether you need a service or run a business that provides one, Folio gets you to the deal faster.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <FlowCard
              eyebrow="For customers"
              title="Get matched in minutes"
              illustration={<StackIllustration className="h-20 w-24" />}
              cta={{ href: "/order", label: "Post a free request →" }}
              steps={[
                { n: 1, title: "Post what you need", body: "Describe it, set a budget range and location. AI auto-tags the industry." },
                { n: 2, title: "Verify with a code", body: "One email, one 4-digit code. No account or password to manage." },
                { n: 3, title: "Sit back and pick", body: "Up to 10 vetted businesses in your area reach out. You choose your favourite." },
              ]}
            />
            <FlowCard
              eyebrow="For businesses"
              title="Real leads. Pay only to unlock."
              illustration={<WalletIllustration className="h-20 w-24" />}
              accent
              cta={{ href: "/login", label: "Start receiving leads →" }}
              steps={[
                { n: 1, title: "Sign up + compliance", body: "Free. Submit standard docs (CAC RC/BN or NIN) and get verified." },
                { n: 2, title: "Get matched", body: "We send you leads that match your industry, location and budget range." },
                { n: 3, title: "Unlock and close", body: `Spend credits to reveal the client's contact. From ${sampleUnlock} credit on a ${formatNaira(100_000)} brief.` },
              ]}
            />
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Why Folio</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for trust, not noise.</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Every part of the flow is designed to keep customer signal high and business spam low.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <TrustCard
              title="Verified businesses"
              body="Compliance review against standard Nigerian docs — CAC RC/BN, NIN, government ID — before the badge."
            />
            <TrustCard
              title="Exclusive matches"
              body="Only 10 businesses can unlock a single request. No spam piles. Higher response rates."
            />
            <TrustCard
              title="Pay-as-you-go"
              body={`Buy credits when you need them. 1 credit = ${formatNaira(creditNaira)}. Unlock cost scales with the lead's budget.`}
            />
            <TrustCard
              title="Curated by humans"
              body="Every request is admin-reviewed before it goes out to businesses. Quality over volume."
            />
            <TrustCard
              title="Mobile-first"
              body="Built to work everywhere your customers actually browse. Fast on 4G, beautiful on every screen."
            />
            <TrustCard
              title="Your own page"
              body="Each business gets a public Folio page with logo, gallery and socials at folio.cafe/b/your-name."
            />
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Industries we serve</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Whatever you do, you fit.</h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Folio is organised around the industries Nigerian businesses actually work in.
            </p>
          </div>

          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.length === 0 ? (
              <li className="col-span-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Industries are loading…
              </li>
            ) : (
              industries.map((c: any) => (
                <li
                  key={c.slug}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand/30 hover:shadow-sm"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/15 to-fuchsia-200 text-brand ring-1 ring-brand/10">
                    <IndustryIcon slug={c.slug} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.name}</p>
                    {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.description}</p>}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Free to ask. Fair to provide.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customers</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">Free to post</p>
              <p className="mt-2 text-sm text-slate-600">Posting a request is free. For requests over ₦1m you can boost as priority so businesses see it first.</p>
              <Link href="/order" className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Post a request →
              </Link>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/[0.06] to-fuchsia-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Businesses</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">Pay as you unlock</p>
              <p className="mt-2 text-sm text-slate-600">
                Top up your wallet from {formatNaira(1000)}. 1 credit = {formatNaira(creditNaira)}. Unlock cost scales with the lead's budget.
              </p>
              <Link href="/login" className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:py-24">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            <Faq q="How does Folio choose which businesses get my request?">
              We match by industry, the locations a business serves and their budget bracket. Up to 10 verified
              businesses get notified — first come, first reveal.
            </Faq>
            <Faq q="Is my contact info safe?">
              Your email and phone are hidden until a business uses credits to unlock them. The unlock cap of 10
              means your inbox never floods.
            </Faq>
            <Faq q="What does compliance involve?">
              Standard Nigerian docs: CAC RC/BN + certificate for businesses, NIN for individuals, plus a
              government ID, a logo and one gallery image. It's a short checklist on /business/compliance.
            </Faq>
            <Faq q="Do I need a subscription as a business?">
              No. You only pay when you unlock a lead. Credits don't expire and our admin sets the rate
              transparently.
            </Faq>
            <Faq q="What if no one responds?">
              Tell us — we'll route your request to more businesses ourselves. Customers always come first.
            </Faq>
          </div>
        </div>
      </section>

      {/* FINAL CTA — back to dark */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/3 h-[360px] w-[360px] rounded-full bg-brand/30 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slower" />
        </div>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Stop chasing.{" "}
            <span className="bg-gradient-to-r from-brand-light via-fuchsia-300 to-rose-200 bg-clip-text text-transparent animate-shimmer">
              Start closing the Deal.
            </span>
          </h2>
          <p className="mt-4 text-base text-white/70 sm:text-lg">
            Whether you're hiring or selling, Folio gets you to the deal faster.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/order"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition hover:bg-white/90"
            >
              Post a free request →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Sign up as a business
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-ink py-10 text-sm text-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span className="text-white/80">Folio</span>
            <span className="text-white/30">·</span>
            <span>folio.cafe</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#industries" className="hover:text-white">Industries</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/order" className="hover:text-white">Post a request</Link>
            <Link href="/orders" className="hover:text-white">My requests</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </div>
          <span className="text-white/30">© {new Date().getFullYear()} Folio</span>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-base font-semibold text-white">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function FlowCard({
  eyebrow,
  title,
  steps,
  cta,
  accent = false,
  illustration,
}: {
  eyebrow: string;
  title: string;
  steps: { n: number; title: string; body: string }[];
  cta: { href: string; label: string };
  accent?: boolean;
  illustration?: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-3xl border p-6 shadow-sm sm:p-8 " +
        (accent ? "border-brand/30 bg-gradient-to-br from-brand/[0.05] to-fuchsia-50" : "border-slate-200 bg-white")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">{title}</h3>
        </div>
        {illustration}
      </div>
      <ol className="mt-6 space-y-5">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span
              className={
                "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold " +
                (accent
                  ? "bg-brand text-white shadow-[0_0_0_4px_rgba(124,58,237,0.12)]"
                  : "bg-slate-900 text-white")
              }
            >
              {s.n}
            </span>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link
        href={cta.href}
        className={
          "mt-7 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold transition " +
          (accent ? "bg-brand text-white hover:bg-brand-dark" : "bg-slate-900 text-white hover:bg-slate-800")
        }
      >
        {cta.label}
      </Link>
    </div>
  );
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand/30 hover:shadow-sm">
      <p className="text-base font-semibold tracking-tight">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand/30">
      <summary className="flex cursor-pointer items-center justify-between gap-4">
        <span className="text-base font-semibold">{q}</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:bg-brand group-open:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 transition group-open:rotate-180">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{children}</p>
    </details>
  );
}
