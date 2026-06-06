import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { changePinAction, sendResetCodeAction } from "./actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  wrong: "Current PIN was incorrect.",
  mismatch: "New PINs didn't match.",
  invalid: "PIN must be 4 digits.",
};

export default async function PinPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("email, pin_hash")
    .eq("id", session.userId!)
    .single();
  const hasPin = !!user?.pin_hash;

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your PIN</h1>
        <p className="mt-1 text-sm text-slate-600">Use this 4-digit PIN to sign in.</p>
      </div>

      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">PIN updated.</p>
      )}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errors[searchParams.error] ?? "Something went wrong."}
        </p>
      )}

      {hasPin ? (
        <form action={changePinAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Change PIN</h2>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Current PIN</label>
            <input
              name="current"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">New PIN</label>
            <input
              name="pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Confirm new PIN</label>
            <input
              name="confirm"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
            />
          </div>
          <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
            Update PIN
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          You don't have a PIN set up yet. <Link href="/login" className="font-medium text-brand">Sign out and set one up.</Link>
        </div>
      )}

      <form action={sendResetCodeAction} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Forgot your PIN?</h2>
        <p className="mt-1 text-sm text-slate-600">
          We'll email a 4-digit code to {user?.email} so you can reset it.
        </p>
        <button className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Email me a reset code
        </button>
      </form>
    </div>
  );
}
