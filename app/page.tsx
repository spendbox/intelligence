import Link from "next/link";
import { signupAction } from "./signup/actions";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Intelligence</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Monthly business insights, delivered to your inbox.
        </h1>
        <p className="mt-4 text-slate-600">
          Pick the categories that matter to your small business. Get curated monthly intelligence
          you can act on.
        </p>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Start your free trial</h2>
          <p className="mt-1 text-sm text-slate-600">No card required. Yearly subscription coming soon.</p>
          <form action={signupAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              name="email"
              required
              placeholder="you@business.com"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
            >
              Start free trial
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
