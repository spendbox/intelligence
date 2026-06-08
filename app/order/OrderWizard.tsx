"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/lib/logo";
import { improveDescriptionAction, sendOrderCodeAction, submitOrderAction, suggestIndustryAction } from "./actions";

type Industry = { id: string; slug: string; name: string };

const STEPS = ["About", "Budget", "Where", "Contact", "Verify"] as const;
const PRIORITY_OPTIONS = [500, 1500, 3000, 5000, 10000];
const COUNTRIES = [
  { code: "+234", iso: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+233", iso: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", iso: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "+27", iso: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+44", iso: "GB", flag: "🇬🇧", name: "UK" },
  { code: "+1", iso: "US", flag: "🇺🇸", name: "US" },
];
const MIN_DESC_WORDS = 8;

function formatNaira(n: number) {
  return "₦" + Math.round(n).toLocaleString();
}

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function PhoneInput({ value, onChange, countryCode, onCountry, placeholder = "8012345678" }: {
  value: string;
  onChange: (v: string) => void;
  countryCode: string;
  onCountry: (code: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:bg-white/10">
      <select
        value={countryCode}
        onChange={(e) => onCountry(e.target.value)}
        aria-label="Country code"
        className="rounded-l-xl bg-transparent px-2 py-3 text-sm text-white outline-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.code} className="bg-ink">
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        inputMode="tel"
        placeholder={placeholder}
        className="w-full rounded-r-xl bg-transparent px-3 py-3 text-base text-white placeholder-white/40 outline-none"
      />
    </div>
  );
}

export default function OrderWizard({ industries }: { industries: Industry[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [improving, setImproving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");

  const [location, setLocation] = useState("");

  const [name, setName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+234");
  const [phone, setPhone] = useState("");

  const [isPriority, setIsPriority] = useState(false);
  const [priorityAmount, setPriorityAmount] = useState<number>(1500);

  const [terms, setTerms] = useState(false);

  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeResentAt, setCodeResentAt] = useState(0);
  const [code, setCode] = useState("");

  const budgetMaxNum = Number(budgetMax) || 0;
  const budgetMinNum = Number(budgetMin) || 0;
  const eligiblePriority = budgetMaxNum > 1_000_000;
  const descWords = wordCount(description);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function suggestIndustry() {
    if (descWords < MIN_DESC_WORDS) return;
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

  async function improveDescription() {
    if (descWords < MIN_DESC_WORDS) return;
    setImproving(true);
    setError(null);
    const fd = new FormData();
    fd.set("description", description);
    try {
      const r = await improveDescriptionAction(fd);
      if (r.ok && r.description) setDescription(r.description);
      else if (r.error) setError(r.error);
    } finally {
      setImproving(false);
    }
  }

  async function sendCode(isResend = false) {
    setError(null);
    setCodeSending(true);
    try {
      const fd = new FormData();
      fd.set("email", email);
      const r = await sendOrderCodeAction(fd);
      if (!r.ok) {
        setError(r.error ?? "Couldn't send code.");
        return;
      }
      setCodeSent(true);
      if (isResend) setCodeResentAt(Date.now());
    } finally {
      setCodeSending(false);
    }
  }

  function submit() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("description", description);
      fd.set("category_id", categoryId);
      fd.set("budget_min", String(budgetMinNum));
      fd.set("budget_max", String(budgetMaxNum));
      fd.set("location", location);
      fd.set("name", name);
      fd.set("phone", `${phoneCountry}${phone}`);
      fd.set("email", email);
      fd.set("code", code);
      fd.set("terms", terms ? "on" : "");
      if (eligiblePriority && isPriority) {
        fd.set("is_priority", "true");
        fd.set("priority_amount", String(priorityAmount));
      }
      if (imageFile) fd.set("image", imageFile);

      const r = await submitOrderAction(fd);
      if (!r.ok) {
        setError(r.error ?? "Something went wrong.");
        return;
      }
      if (r.priorityRedirect) {
        window.location.href = r.priorityRedirect;
      } else {
        router.push("/order/done");
      }
    });
  }

  const canNext = (() => {
    if (step === 0) return descWords >= MIN_DESC_WORDS && !!categoryId;
    if (step === 1) return budgetMaxNum > 0 && budgetMaxNum >= budgetMinNum;
    if (step === 2) return location.trim().length >= 2;
    if (step === 3) return name.trim().length >= 2 && phone.trim().length >= 6;
    if (step === 4) return codeSent && /^\d{4}$/.test(code) && terms;
    return false;
  })();

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[380px] w-[380px] rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-xl flex-col px-5 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <LogoMark className="h-6 w-6" />
            Folio
          </Link>
          <Link href="/" className="text-xs text-white/60 hover:text-white">Cancel</Link>
        </header>

        <div className="mt-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Post your request</h1>
          <p className="mt-1 text-sm text-white/60">Tell us what you need. We'll match it with trusted businesses.</p>
        </div>

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
              <p className="mt-1 text-sm text-white/60">Describe the product, service or help you're looking for. {MIN_DESC_WORDS}+ words.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="e.g. Need a 3-bedroom flat in Lekki Phase 1, fully serviced, for 12 months from December."
                className="mt-3 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={descWords >= MIN_DESC_WORDS ? "text-emerald-300" : "text-white/50"}>
                  {descWords} / {MIN_DESC_WORDS}+ words
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={improveDescription}
                    disabled={improving || descWords < MIN_DESC_WORDS}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                  >
                    {improving && <Spinner />}
                    {improving ? "Improving…" : "✨ Improve with AI"}
                  </button>
                  <button
                    type="button"
                    onClick={suggestIndustry}
                    disabled={aiBusy || descWords < MIN_DESC_WORDS}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                  >
                    {aiBusy ? "Detecting…" : "Auto-detect industry"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium uppercase tracking-wide text-white/60">Industry <span className="text-rose-300">*</span></label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl bg-white/5 px-3 py-3 text-sm text-white outline-none focus:bg-white/10"
                >
                  <option value="" className="bg-ink">— Select an industry —</option>
                  {industries.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink">{c.name}</option>
                  ))}
                </select>
                {!categoryId && (
                  <p className="mt-1 text-xs text-white/50">Industry is required to continue.</p>
                )}
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium uppercase tracking-wide text-white/60">Reference image <span className="text-white/40">(optional)</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
                />
                {imageFile && <p className="mt-1 text-xs text-white/60">{imageFile.name}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold">What's your budget?</h2>
              <p className="mt-1 text-sm text-white/60">Enter a range in naira. Businesses use this to decide if they're a fit.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Minimum (₦)</label>
                  <input
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="e.g. 50000"
                    className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-white/60">Maximum (₦)</label>
                  <input
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="e.g. 100000"
                    className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:bg-white/10"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-white/50">
                {budgetMinNum > 0 || budgetMaxNum > 0
                  ? `Range: ${formatNaira(budgetMinNum)} – ${formatNaira(budgetMaxNum)}`
                  : "Type the lowest and highest amounts you're willing to spend."}
              </p>

              {eligiblePriority && (
                <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isPriority}
                      onChange={(e) => setIsPriority(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-amber-400"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">🔥 Boost as priority</p>
                      <p className="mt-0.5 text-xs text-white/70">
                        Recommended for budgets over ₦1m. A small priority fee tells businesses you're committed — they prioritise serious buyers and respond faster with sharper quotes.
                      </p>
                    </div>
                  </label>
                  {isPriority && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PRIORITY_OPTIONS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPriorityAmount(amt)}
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium transition " +
                            (priorityAmount === amt
                              ? "bg-amber-400 text-amber-950"
                              : "border border-amber-300/40 bg-white/5 text-white/80 hover:bg-white/10")
                          }
                        >
                          {formatNaira(amt)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-white/60">Phone</label>
                  <div className="mt-1">
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      countryCode={phoneCountry}
                      onCountry={setPhoneCountry}
                    />
                  </div>
                </div>
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
                  onClick={() => sendCode(false)}
                  disabled={!/^\S+@\S+\.\S+$/.test(email) || codeSending}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-semibold text-ink hover:bg-white/90 disabled:opacity-50"
                >
                  {codeSending && <Spinner />}
                  {codeSending ? "Sending…" : "Send verification code"}
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
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => sendCode(true)}
                      disabled={codeSending}
                      className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white disabled:opacity-50"
                    >
                      {codeSending && <Spinner />}
                      {codeSending ? "Sending…" : "Resend code"}
                    </button>
                    {codeResentAt > 0 && Date.now() - codeResentAt < 5000 && (
                      <span className="text-xs text-emerald-300">Sent ✓</span>
                    )}
                  </div>
                </>
              )}

              <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span>
                  I agree to Folio's{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-brand-light underline">
                    Terms & Conditions
                  </Link>
                  .
                </span>
              </label>
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.8)] disabled:opacity-50"
            >
              {pending && <Spinner />}
              {pending ? "Submitting…" : isPriority && eligiblePriority ? `Submit & pay ${formatNaira(priorityAmount)}` : "Submit request"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
