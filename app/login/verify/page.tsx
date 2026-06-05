import Link from "next/link";
import { verifyPinAction } from "../actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Enter the 4-digit code from your email.",
  expired: "That code has expired. Request a new one.",
  wrong: "Incorrect code. Try again.",
  locked: "Too many attempts. Request a new code.",
};

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string; error?: string };
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Enter your code</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sent to <span className="font-medium">{searchParams.email}</span>. Expires in 10 minutes.
          </p>
          <form action={verifyPinAction} className="mt-5 space-y-3">
            <input type="hidden" name="email" value={searchParams.email ?? ""} />
            <input
              name="pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              autoFocus
              autoComplete="one-time-code"
              placeholder="0000"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white hover:bg-brand-dark">
              Verify
            </button>
          </form>
          {searchParams.error && (
            <p className="mt-3 text-sm text-rose-600">{errors[searchParams.error] ?? "Something went wrong."}</p>
          )}
        </div>
      </div>
    </main>
  );
}
