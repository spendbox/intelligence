import { formatBudgetRange } from "@/lib/leads";

export type BusinessProfile = {
  industries: string[];
  locations: string[];
  budgets: { min: number; max: number }[];
  bio?: string | null;
};

export function buildQueries(p: BusinessProfile): string[] {
  const industries = p.industries.length > 0 ? p.industries : ["service business"];
  const locations = p.locations.length > 0 ? p.locations : ["Nigeria"];
  const budget = p.budgets[0];
  const budgetStr = budget ? formatBudgetRange(budget.min, budget.max) : "";

  const out = new Set<string>();
  for (const ind of industries) {
    for (const loc of locations) {
      out.add(`${ind} services needed in ${loc}`);
      out.add(`hire ${ind} ${loc}${budgetStr ? ` budget ${budgetStr}` : ""}`);
      out.add(`${ind} request for quote ${loc}`);
    }
  }
  // Cap so a wide profile doesn't fan out forever.
  return Array.from(out).slice(0, 6);
}
