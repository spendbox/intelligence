import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const symbols: Record<string, string> = { NGN: "₦", USD: "$", GHS: "₵", ZAR: "R", KES: "KSh" };

export default async function AdminSettingsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const s = await getSettings();
  const monthly = (s.price_monthly_kobo / 100).toFixed(2);
  const yearly = (s.price_yearly_kobo / 100).toFixed(2);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Payment configuration and pricing.</p>
      </div>

      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>
      )}

      <form action={saveSettingsAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="font-medium">Paystack payments</p>
            <p className="mt-1 text-sm text-slate-600">
              When off, users see a "Coming soon" placeholder. When on, they can subscribe to the plans below.
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              name="paystack_enabled"
              defaultChecked={s.paystack_enabled}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium">Currency</label>
          <select
            name="currency"
            defaultValue={s.currency}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="NGN">NGN (₦)</option>
            <option value="USD">USD ($)</option>
            <option value="GHS">GHS (₵)</option>
            <option value="ZAR">ZAR (R)</option>
            <option value="KES">KES</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Monthly price</label>
            <div className="mt-1 flex rounded-lg border border-slate-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center px-3 text-slate-500">{symbols[s.currency] ?? s.currency}</span>
              <input
                type="number"
                name="price_monthly"
                step="0.01"
                min="0"
                required
                defaultValue={monthly}
                inputMode="decimal"
                className="w-full rounded-r-lg px-3 py-2 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">e.g. 5000.99</p>
          </div>
          <div>
            <label className="text-sm font-medium">Yearly price</label>
            <div className="mt-1 flex rounded-lg border border-slate-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center px-3 text-slate-500">{symbols[s.currency] ?? s.currency}</span>
              <input
                type="number"
                name="price_yearly"
                step="0.01"
                min="0"
                required
                defaultValue={yearly}
                inputMode="decimal"
                className="w-full rounded-r-lg px-3 py-2 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">e.g. 50000.00</p>
          </div>
        </div>

        <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
          Save settings
        </button>
      </form>
    </div>
  );
}
