import Link from "next/link";

export default function DonePage() {
  return (
    <main className="min-h-screen bg-ink px-5 py-16 text-white">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7 text-emerald-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4 10-10" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold">Request submitted</h1>
        <p className="mt-2 text-white/70">Our team is reviewing your request. As soon as it's approved we'll match it with trusted businesses in your area — they'll reach out directly.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">
          Back home
        </Link>
      </div>
    </main>
  );
}
