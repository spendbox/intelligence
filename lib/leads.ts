// Folio leads marketplace helpers — credit math, matching, naira formatting.

export const KOBO = 100;
export const CREDIT_PER_NAIRA = 0.1; // ₦10 = 1 credit
export const UNLOCK_RATE = 0.0001;   // budget * 0.001 / 10 = budget / 10000
export const MIN_NOTIFICATION_CREDITS = 500;
export const UNLOCK_CAP_DEFAULT = 10;
export const TOPUP_MIN_NAIRA = 1000;
export const TOPUP_MAX_NAIRA = 1_000_000;

export function nairaToCredits(naira: number): number {
  return Math.floor(naira * CREDIT_PER_NAIRA);
}

export function unlockCreditsFor(budgetMax: number): number {
  return Math.max(1, Math.floor(budgetMax * UNLOCK_RATE));
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
