"use client";

import { useState } from "react";
import { startTopupAction } from "./actions";

const QUICK = [1000, 5000, 10000, 50000, 100000, 500000];

function formatNaira(n: number) {
  return "₦" + Math.round(n).toLocaleString();
}

function formatCreditsLive(n: number) {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TopUpForm({
  nairaPerCredit,
  minNaira,
  maxNaira,
}: {
  nairaPerCredit: number;
  minNaira: number;
  maxNaira: number;
}) {
  const [amount, setAmount] = useState<string>("");
  const [pending, setPending] = useState(false);
  const naira = Number(amount) || 0;
  const creditsPreview = Math.max(0, Math.round((naira / nairaPerCredit) * 100) / 100);
  const valid = naira >= minNaira && naira <= maxNaira;

  async function quickTopup(amt: number) {
    setPending(true);
    const fd = new FormData();
    fd.set("amount", String(amt));
    try {
      await startTopupAction(fd);
    } catch {
      setPending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    const fd = new FormData();
    fd.set("amount", String(naira));
    try {
      await startTopupAction(fd);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Top up</h2>
      <p className="text-xs text-slate-500">Minimum {formatNaira(minNaira)} · maximum {formatNaira(maxNaira)}.</p>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => quickTopup(amt)}
            disabled={pending}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {formatNaira(amt)} · +{formatCreditsLive(amt / nairaPerCredit)} credits
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-2 space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minNaira}
            max={maxNaira}
            placeholder="Custom amount (₦)"
            inputMode="numeric"
            disabled={pending}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            disabled={!valid || pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {pending ? "Redirecting…" : "Top up"}
          </button>
        </div>
        {naira > 0 && (
          <p className={"text-xs " + (valid ? "text-emerald-700" : "text-amber-700")}>
            {valid
              ? `${formatNaira(naira)} = ${formatCreditsLive(creditsPreview)} credits`
              : naira < minNaira
              ? `Minimum top-up is ${formatNaira(minNaira)}`
              : `Maximum top-up is ${formatNaira(maxNaira)}`}
          </p>
        )}
      </form>
    </div>
  );
}
