import { verifyPinAction } from "../actions";

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
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Enter your code</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a 4-digit code to <span className="font-medium">{searchParams.email}</span>. It expires in 10 minutes.
        </p>
        <form action={verifyPinAction} className="mt-6 space-y-3">
          <input type="hidden" name="email" value={searchParams.email ?? ""} />
          <input
            name="pin"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            placeholder="0000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.5em] outline-none focus:border-brand"
          />
          <button className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Verify
          </button>
        </form>
        {searchParams.error && (
          <p className="mt-3 text-sm text-rose-600">{errors[searchParams.error] ?? "Something went wrong."}</p>
        )}
      </div>
    </main>
  );
}
