import Link from "next/link";
import { redirect } from "next/navigation";
import { createPinAction, verifySetupCodeAction } from "../actions";
import { getPinSetupSession, PIN_SETUP_MAX_AGE_MS } from "@/lib/auth/session";
import { LogoMark } from "@/lib/logo";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Enter the 4-digit code from your email.",
  expired: "That code has expired. Request a new one.",
  wrong: "Incorrect code. Try again.",
  locked: "Too many attempts. Try again later.",
  mismatch: "PINs didn't match. Try again.",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { email?: string; error?: string; reset?: string; stage?: string };
}) {
  if (!searchParams.email) redirect("/login");

  const setup = await getPinSetupSession();
  const codeVerified =
    !!setup.email &&
    setup.email === searchParams.email &&
    !!setup.verifiedAt &&
    Date.now() - setup.verifiedAt < PIN_SETUP_MAX_AGE_MS;

  const isReset = !!searchParams.reset;
  const showPinForm = codeVerified || searchParams.stage === "choose";

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
          {!showPinForm ? (
            <>
              <h1 className="text-2xl font-bold">{isReset ? "Reset your PIN" : "Set up your PIN"}</h1>
              <p className="mt-2 text-sm text-slate-600">
                We emailed a 4-digit code to <span className="font-medium">{searchParams.email}</span>. Enter it below to continue.
              </p>

              <form action={verifySetupCodeAction} className="mt-5 space-y-3">
                <input type="hidden" name="email" value={searchParams.email} />
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  placeholder="0000"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <SubmitButton className="w-full bg-brand px-4 py-3 text-base" pendingLabel="Verifying…">
                  Verify
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Choose your PIN</h1>
              <p className="mt-2 text-sm text-slate-600">
                Pick a 4-digit PIN. You'll use it to sign in from now on.
              </p>

              <form action={createPinAction} className="mt-5 space-y-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">New PIN</label>
                  <input
                    name="pin"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                    autoFocus
                    placeholder="••••"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Confirm PIN</label>
                  <input
                    name="confirm"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                    placeholder="••••"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <SubmitButton className="w-full bg-brand px-4 py-3 text-base" pendingLabel="Saving…">
                  Save PIN & sign in
                </SubmitButton>
              </form>
            </>
          )}

          {searchParams.error && (
            <p className="mt-3 text-sm text-rose-600">{errors[searchParams.error] ?? "Something went wrong."}</p>
          )}
        </div>
      </div>
    </main>
  );
}
