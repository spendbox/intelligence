// Folio leads marketplace helpers — credit math, matching, naira formatting.
import { getSettings } from "@/lib/settings";

export const KOBO = 100;
export const DEFAULT_NAIRA_PER_CREDIT = 10;      // ₦10 = 1 credit
export const DEFAULT_UNLOCK_RATE = 0.00001;       // budget × this = credits
export const MIN_NOTIFICATION_CREDITS = 1;
export const UNLOCK_CAP_DEFAULT = 10;
export const TOPUP_MIN_NAIRA = 1000;
export const TOPUP_MAX_NAIRA = 1_000_000;

// Sync helpers (fallback defaults — used for previews / inputs).
export function nairaToCredits(naira: number, nairaPerCredit = DEFAULT_NAIRA_PER_CREDIT): number {
  if (nairaPerCredit <= 0) return 0;
  // Decimal-friendly: round to 2 dp instead of flooring.
  return Math.round((naira / nairaPerCredit) * 100) / 100;
}

export function unlockCreditsFor(budgetMax: number, rate = DEFAULT_UNLOCK_RATE): number {
  const raw = budgetMax * rate;
  // No min / max — admin's rate determines everything.
  return Math.max(0, Math.round(raw * 100) / 100);
}

export function formatCredits(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// ── Top-up bonus tiers ───────────────────────────────────────────────────────
// Bonus credits added on Paystack top-ups (NOT on admin manual credits).
export const BONUS_TIERS: { min: number; percent: number }[] = [
  { min: 100_000, percent: 50 },
  { min: 30_000, percent: 25 },
  { min: 10_000, percent: 10 },
];

export function bonusPercentFor(naira: number): number {
  for (const t of BONUS_TIERS) if (naira >= t.min) return t.percent;
  return 0;
}

export function bonusCreditsFor(baseCredits: number, naira: number): number {
  const pct = bonusPercentFor(naira);
  return Math.round(baseCredits * pct) / 100;
}

export function totalCreditsForTopup(naira: number, nairaPerCredit = DEFAULT_NAIRA_PER_CREDIT): {
  base: number;
  bonus: number;
  total: number;
  bonusPercent: number;
} {
  const base = nairaToCredits(naira, nairaPerCredit);
  const bonusPercent = bonusPercentFor(naira);
  const bonus = Math.round(base * bonusPercent) / 100;
  const total = Math.round((base + bonus) * 100) / 100;
  return { base, bonus, total, bonusPercent };
}

// Async helpers — read live config from app_settings.
export async function computeCreditsForNaira(naira: number): Promise<number> {
  const s = await getSettings();
  return nairaToCredits(naira, s.naira_per_credit || DEFAULT_NAIRA_PER_CREDIT);
}

export async function computeUnlockCredits(budgetMax: number): Promise<number> {
  const s = await getSettings();
  return unlockCreditsFor(budgetMax, s.unlock_rate || DEFAULT_UNLOCK_RATE);
}

export function formatNaira(naira: number): string {
  return "₦" + Math.round(naira).toLocaleString();
}

export function formatBudgetRange(min: number, max: number): string {
  return `${formatNaira(min)} – ${formatNaira(max)}`;
}

export const BUDGET_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "Under ₦10,000", min: 0, max: 10000 },
  { label: "₦10,000 – ₦50,000", min: 10000, max: 50000 },
  { label: "₦50,000 – ₦100,000", min: 50000, max: 100000 },
  { label: "₦100,000 – ₦250,000", min: 100000, max: 250000 },
  { label: "₦250,000 – ₦500,000", min: 250000, max: 500000 },
  { label: "₦500,000 – ₦1,000,000", min: 500000, max: 1_000_000 },
  { label: "₦1,000,000 – ₦5,000,000", min: 1_000_000, max: 5_000_000 },
  { label: "Over ₦5,000,000", min: 5_000_000, max: 50_000_000 },
];

// Locations: free text, comma-separated. Match is case-insensitive substring either way.
export function locationsMatch(businessLocs: string[], requestLoc: string): boolean {
  const target = requestLoc.toLowerCase().trim();
  if (!target) return false;
  for (const raw of businessLocs) {
    const loc = raw.toLowerCase().trim();
    if (!loc) continue;
    if (target.includes(loc) || loc.includes(target)) return true;
  }
  return false;
}
