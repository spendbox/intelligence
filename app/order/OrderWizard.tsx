"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendOrderCodeAction, submitOrderAction, suggestIndustryAction } from "./actions";

type Industry = { id: string; slug: string; name: string };
type BudgetPreset = { label: string; min: number; max: number };

const STEPS = ["About", "Budget", "Where", "Contact", "Verify"] as const;

export default function OrderWizard({ industries, budgets }: { industries: Industry[]; budgets: BudgetPreset[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);

  const [budgetIdx, setBudgetIdx] = useState<number>(-1);
  const [budgetMin, setBudgetMin] = useState<number>(0);
  const [budgetMax, setBudgetMax] = useState<number>(0);

  const [location, setLocation] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function pickBudget(i: number) {
    setBudgetIdx(i);
    setBudgetMin(budgets[i].min);
    setBudgetMax(budgets[i].max);
  }

  async function suggestIndustry() {
    if (description.trim().length < 8) return;
    setAiBusy(true);
    const fd = new FormData();
    fd.set("description", description);
    try {
      const r = await suggestIndustryAction(fd);
      if (r.categoryId) setCategoryId(r.categoryId);
    } finally {
      setAiBusy(false);
    }
  }

  async function sendCode() {
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    const r = await sendOrderCodeAction(fd);
    if (!r.ok) {
      setError(r.error ?? "Couldn't send code.");
      return;
    }
    setCodeSent(true);
  }

  function submit() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("description", description);
      if (categoryId) fd.set("category_id", categoryId);
      fd.set("budget_min", String(budgetMin));
      fd.set("budget_max", String(budgetMax));
      fd.set("location", location);
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("code", code);
      const r = await submitOrderAction(fd);
      if (!r.ok) {
        setError(r.error ?? "Something went wrong.");
        return;
      }
      router.push(`/order/done`);
    });
  }

  const canNext = (() => {
    if (step === 0) return description.trim().length >= 8;
    if (step === 1) return budgetMax > 0 && budgetMax >= budgetMin;
    if (step === 2) return location.trim().length >= 2;
    if (step === 3) return name.trim().length >= 2 && phone.trim().length >= 6;
    if (step === 4) return codeSent && /^\d{4}$/.test(code);
    return false;
  })();

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[380px] w-[380px] rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-xl flex-col px-5 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand to-fuchsia-400" />
            Folio
          </Link>
          <Link href="/" className="text-xs text-white/60 hover:text-white">Cancel</Link>
        </header>

        <div className="mt-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Post your request</h1>
          <p className="mt-1 text-sm text-white/60">Tell us what you need. We'll match it with trusted businesses.</p>
        </div>

        {/* Stepper */}
        <ol className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 " +
                  (i < step
                    ? "bg-brand text-white ring-brand"
                    : i === step
                    ? "bg-white text-ink ring-white"
                    : "bg-white/5 text-white/60 ring-white/15")
                }
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 && <span className={"h-px flex-1 " + (i < step ? "bg-brand" : "bg-white/15")} />}
            </li>
          ))}
        </ol>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold">What do you need?</h2>
              <p className="mt-1 text-sm text-white/60">Describe the product, service or help you're looking for.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="e.g. Need a 3-bedroom flat in Lekki Phase 1, fully serviced, for 12 months from December."
                className="mt-3 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={suggestIndustry}
                  disabled={aiBusy || description.trim().length < 8}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                >
                  {aiBusy ? "Detecting…" : "Auto-detect industry"}
                </button>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none focus:bg-white/10"
                >
                  <option value="" className="bg-ink">— Select an industry —</option>
                  {industries.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold">What's your budget?</h2>
              <p className="mt-1 text-sm text-white/60">Pick the range that fits — businesses use this to decide if they're a fit.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {budgets.map((b, i) => {
                  const active = budgetIdx === i;
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => pickBudget(i)}
                      className={
                        "rounded-xl border px-3 py-3 text-left text-sm font-medium transition " +
                        (active
                          ? "border-brand bg-brand/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]")
                      }
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold">Where are you located?</h2>
              <p className="mt-1 text-sm text-white/60">City, area, or region. Businesses serving this location will be notified.</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lekki Phase 1, Lagos"
                className="mt-3 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold">How should they reach you?</h2>
              <p className="mt-1 text-sm text-white/60">Only revealed to businesses that pay credits to unlock — limited to 10.</p>
              <div className="mt-3 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="Phone number"
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold">Confirm your email</h2>
              <p className="mt-1 text-sm text-white/60">We'll send a 4-digit code to verify it's really you.</p>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                className="mt-3 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
              />
              {!codeSent ? (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={!/^\S+@\S+\.\S+$/.test(email)}
                  className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-base font-semibold text-ink hover:bg-white/90 disabled:opacity-50"
                >
                  Send verification code
                </button>
              ) : (
                <>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    pattern="\d{4}"
                    placeholder="0000"
                    className="mt-3 w-full rounded-xl bg-white/5 px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] text-white outline-none focus:bg-white/10"
                  />
                  <button type="button" onClick={sendCode} className="mt-2 text-xs text-white/60 hover:text-white">
                    Resend code
                  </button>
                </>
              )}
            </div>
          )}

          {error && <p className="mt-3 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || pending}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              className="rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)] disabled:opacity-50"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canNext || pending}
              className="rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)] disabled:opacity-50"
            >
              {pending ? "Submitting…" : "Submit request"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
