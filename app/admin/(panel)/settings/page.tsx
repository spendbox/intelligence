import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const symbols: Record<string, string> = { NGN: "₦", USD: "$", GHS: "₵", ZAR: "R", KES: "KSh" };

export default async function AdminSettingsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const s = await getSettings();
  const symbol = symbols[s.currency] ?? s.currency;

  // Live previews
  const example100k = Math.max(1, Math.floor(100000 * s.unlock_rate));
  const example1m = Math.max(1, Math.floor(1_000_000 * s.unlock_rate));
  const exampleCreditsFor1k = Math.floor(1000 / s.naira_per_credit);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Payments and the credit economy.</p>
      </div>

      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>
      )}
      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Some inputs were invalid — settings unchanged.</p>
      )}

      <form action={saveSettingsAction} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Paystack toggle */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="font-medium">Paystack payments</p>
            <p className="mt-1 text-sm text-slate-600">When off, wallet top-ups are disabled.</p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input type="checkbox" name="paystack_enabled" defaultChecked={s.paystack_enabled} className="peer sr-only" />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </label>
        </div>

        {/* Currency */}
        <div>
          <label className="text-sm font-medium">Currency</label>
          <select name="currency" defaultValue={s.currency} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="NGN">NGN (₦)</option>
            <option value="USD">USD ($)</option>
            <option value="GHS">GHS (₵)</option>
            <option value="ZAR">ZAR (R)</option>
            <option value="KES">KES</option>
          </select>
        </div>

        {/* Credit economy */}
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Credit economy</h2>
          <p className="mt-1 text-xs text-slate-600">Controls how {symbol} converts to credits and how much it costs to unlock leads.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Cost of 1 credit ({symbol})</label>
              <div className="mt-1 flex rounded-lg border border-slate-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <span className="flex items-center px-3 text-slate-500">{symbol}</span>
                <input
                  type="number"
                  name="naira_per_credit"
                  step="1"
                  min="1"
                  required
                  defaultValue={s.naira_per_credit}
                  inputMode="numeric"
                  className="w-full rounded-r-lg px-3 py-2 outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {symbol}1,000 top-up = <strong>{exampleCreditsFor1k.toLocaleString()} credits</strong>.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Unlock rate</label>
              <input
                type="number"
                name="unlock_rate"
                step="0.0000001"
                min="0"
                required
                defaultValue={s.unlock_rate}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                budget × this rate = credits. {symbol}100,000 → <strong>{example100k} credits</strong>; {symbol}1m → <strong>{example1m} credits</strong>.
              </p>
            </div>
          </div>
        </div>

        <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
          Save settings
        </button>
      </form>
    </div>
  );
}
