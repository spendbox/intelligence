"use client";

import Link from "next/link";
import { useState } from "react";
import { BONUS_TIERS, bonusPercentFor, formatCredits, formatNaira } from "@/lib/leads";

export default function CalculatorSection({
  nairaPerCredit,
  unlockRate,
}: {
  nairaPerCredit: number;
  unlockRate: number;
}) {
  const [topupAmount, setTopupAmount] = useState<string>("30000");
  const [budgetAmount, setBudgetAmount] = useState<string>("1000000");

  const naira = Math.max(0, Number(topupAmount) || 0);
  const base = Math.max(0, Math.round((naira / Math.max(1, nairaPerCredit)) * 100) / 100);
  const bonusPct = bonusPercentFor(naira);
  const bonus = Math.round(base * bonusPct) / 100;
  const total = Math.round((base + bonus) * 100) / 100;

  const budget = Math.max(0, Number(budgetAmount) || 0);
  const unlockCost = Math.max(0, Math.round(budget * unlockRate * 100) / 100);
  const unlockNaira = Math.round(unlockCost * nairaPerCredit);
  const unlocksFromTopup = unlockCost > 0 ? Math.floor(total / unlockCost) : 0;

  // For nudging up to the next bonus tier
  const nextTier = BONUS_TIERS.slice().reverse().find((t) => naira < t.min);

  return (
    <section className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Estimate</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Run the numbers before you sign up.</h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            See what you'd get from a top-up and how many credits it costs to unlock the type of lead you'd be chasing.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Top-up estimator */}
          <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand/[0.04] to-fuchsia-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">If I top up</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">How many credits do I get?</h3>

            <label className="mt-5 block text-sm font-medium">Top-up amount</label>
            <div className="mt-1 flex rounded-xl border border-slate-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center px-3 text-slate-500">₦</span>
              <input
                type="number"
                inputMode="numeric"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g. 30000"
                className="w-full rounded-r-xl bg-transparent px-3 py-3 text-base outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Every ₦{nairaPerCredit} = 1 credit. Paystack top-ups also earn bonuses.</p>

            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">You'd get</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-brand">
                {formatCredits(total)} <span className="text-base font-medium text-slate-500">credits</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatCredits(base)} base
                {bonus > 0 && (
                  <> + <strong className="text-emerald-700">{formatCredits(bonus)} bonus</strong> ({bonusPct}%)</>
                )}
              </p>
              {bonusPct > 0 ? (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  🎁 +{bonusPct}% top-up bonus applied
                </div>
              ) : nextTier ? (
                <p className="mt-3 text-xs text-slate-500">
                  Top up <strong>{formatNaira(nextTier.min - naira)}</strong> more to unlock the {nextTier.percent}% bonus.
                </p>
              ) : null}
            </div>

            <ul className="mt-4 grid gap-1 text-xs text-slate-500">
              <li>· ₦10,000 – ₦29,999 → +10% bonus</li>
              <li>· ₦30,000 – ₦99,999 → +25% bonus</li>
              <li>· ₦100,000 and above → +50% bonus</li>
            </ul>
          </article>

          {/* Unlock estimator */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">If a lead's budget is</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">How much will it cost to unlock?</h3>

            <label className="mt-5 block text-sm font-medium">Lead budget (max)</label>
            <div className="mt-1 flex rounded-xl border border-slate-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center px-3 text-slate-500">₦</span>
              <input
                type="number"
                inputMode="numeric"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g. 1000000"
                className="w-full rounded-r-xl bg-transparent px-3 py-3 text-base outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Unlock cost = budget × rate. Current rate: {unlockRate.toLocaleString(undefined, { maximumFractionDigits: 6 })}.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unlock cost</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">
                {formatCredits(unlockCost)} <span className="text-base font-medium text-slate-500">credits</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">≈ {formatNaira(unlockNaira)} from your wallet</p>
              {naira > 0 && unlocksFromTopup > 0 && (
                <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Your {formatNaira(naira)} top-up unlocks ~{unlocksFromTopup} of these
                </p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Quick examples:{" "}
              {[100_000, 500_000, 1_000_000, 5_000_000].map((b, i) => {
                const c = Math.max(0, Math.round(b * unlockRate * 100) / 100);
                return (
                  <span key={b}>
                    {i > 0 && " · "}
                    <button
                      type="button"
                      onClick={() => setBudgetAmount(String(b))}
                      className="font-medium text-brand hover:underline"
                    >
                      {formatNaira(b)} → {formatCredits(c)} credits
                    </button>
                  </span>
                );
              })}
            </p>
          </article>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sign up & top up →
          </Link>
        </div>
      </div>
    </section>
  );
}
