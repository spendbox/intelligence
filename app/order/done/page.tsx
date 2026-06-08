import Link from "next/link";
import { LogoMark } from "@/lib/logo";

export default function DonePage({ searchParams }: { searchParams: { priority?: string } }) {
  const priority = searchParams.priority;
  const priorityCopy =
    priority === "success"
      ? "Priority confirmed — businesses know you're a serious buyer and will reach out first with sharper quotes."
      : priority === "failed"
      ? "Priority payment didn't complete, but your request is still in for review."
      : null;

  return (
    <main className="min-h-screen bg-ink px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
          <LogoMark className="h-6 w-6" />
          Folio
        </Link>
        <div className="mt-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7 text-emerald-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4 10-10" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold">Request submitted</h1>
          <p className="mt-2 text-white/70">Our team is reviewing your request. As soon as it's approved we'll match it with trusted businesses in your area — they'll reach out directly.</p>
          {priorityCopy && (
            <p className={`mt-4 rounded-md px-3 py-2 text-sm ${priority === "success" ? "bg-amber-400/15 text-amber-200" : "bg-rose-500/10 text-rose-200"}`}>
              {priorityCopy}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/orders" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90">
              See your requests
            </Link>
            <Link href="/" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
