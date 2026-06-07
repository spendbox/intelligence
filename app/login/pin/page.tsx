import Link from "next/link";
import { redirect } from "next/navigation";
import { forgotPinAction, signInWithPinAction } from "../actions";
import { LogoMark } from "@/lib/logo";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Enter your 4-digit PIN.",
  wrong: "Incorrect PIN. Try again.",
};

export default function PinEntryPage({
  searchParams,
}: {
  searchParams: { email?: string; error?: string };
}) {
  if (!searchParams.email) redirect("/login");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800">
            <LogoMark className="h-5 w-5" />
            Folio
          </Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Enter your PIN</h1>
          <p className="mt-2 text-sm text-slate-600">
            Signing in as <span className="font-medium">{searchParams.email}</span>.
          </p>

          <form action={signInWithPinAction} className="mt-5 space-y-3">
            <input type="hidden" name="email" value={searchParams.email} />
            <input
              name="pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <SubmitButton className="w-full bg-brand px-4 py-3 text-base" pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </form>

          {searchParams.error && (
            <p className="mt-3 text-sm text-rose-600">{errors[searchParams.error] ?? "Something went wrong."}</p>
          )}

          <form action={forgotPinAction} className="mt-6 border-t border-slate-100 pt-4 text-center">
            <input type="hidden" name="email" value={searchParams.email} />
            <button className="text-sm font-medium text-brand hover:text-brand-dark">
              Forgot your PIN?
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
