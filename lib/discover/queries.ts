import { env } from "@/lib/env";
import { formatBudgetRange } from "@/lib/leads";

export type BusinessProfile = {
  industries: string[];
  locations: string[];
  budgets: { min: number; max: number }[];
  bio?: string | null;
};

// Forums and social platforms where humans actually post requests in their
// own words. Tavily uses these as include_domains for the precision pass.
export const DEMAND_HINT_DOMAINS = [
  "nairaland.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "quora.com",
  "linkedin.com",
  "facebook.com",
  "medium.com",
];

// Listing aggregators where the author is selling, not buying. We exclude
// these everywhere to stop them flooding results.
export const SUPPLY_BLOCKLIST_DOMAINS = [
  "jiji.ng",
  "jiji.com",
  "propertypro.ng",
  "nigeriapropertycentre.com",
  "jumia.com.ng",
  "konga.com",
  "olx.com.ng",
  "tonaton.com",
];

const DEMAND_VERBS = [
  '"looking for"',
  '"in search of"',
  '"need"',
  '"wanted"',
  '"hiring"',
  '"recommend"',
];

// Template fallback when the LLM rewriter is unavailable. Wraps the user
// query in demand-side verbs and site filters so Tavily favours posts where
// someone is asking, not selling.
export function templateDemandQueries(
  profile: BusinessProfile,
  userQuery: string
): string[] {
  const topic = (userQuery || profile.industries[0] || "service").trim();
  const loc = profile.locations[0] || "Nigeria";
  const budget = profile.budgets[0];
  const budgetStr = budget ? formatBudgetRange(budget.min, budget.max) : "";

  const out = new Set<string>();
  out.add(`(${DEMAND_VERBS.join(" OR ")}) ${topic} ${loc}`);
  out.add(`"anyone know" OR "can someone recommend" ${topic} ${loc}`);
  out.add(`${topic} ${loc} ${budgetStr ? `budget ${budgetStr}` : "budget"}`);
  out.add(
    `site:nairaland.com OR site:reddit.com OR site:x.com "${topic}" ${loc}`
  );
  return Array.from(out).slice(0, 4);
}

const REWRITER_SYSTEM = `You write Google search queries that find demand-side
posts: real people seeking, hiring, or wanting to buy a service or product.
You never produce queries that would return seller listings, agency
homepages, or product catalogues. You always return valid JSON of the form
{"queries": ["...", "..."]}.`;

function rewriterUser(profile: BusinessProfile, userQuery: string): string {
  const loc = profile.locations[0] || "Nigeria";
  const budget = profile.budgets[0];
  return `Business industries: ${profile.industries.join(", ") || "any"}
Business locations served: ${profile.locations.join(", ") || "Nigeria"}
Budget range the business serves: ${budget ? `${budget.min}–${budget.max}` : "any"}
User's natural-language ask: "${userQuery || "find me leads"}"

Write 4 Google queries that surface DEMAND posts: forum threads, social
posts, RFPs, and callouts where the AUTHOR is the person who wants/needs/
is hiring for the thing — never sellers, never listings.

Use these tactics, mixing them:
- Wrap the topic with demand verbs in quotes: ("looking for" OR "need" OR
  "wanted" OR "hiring" OR "in search of" OR "anyone know") topic ${loc}.
- Add site: filters for nairaland.com, reddit.com, x.com, twitter.com,
  quora.com, linkedin.com to pull from forums/social.
- Include a budget or quantity phrasing when relevant.
- Use Nigerian-specific phrasing when the location is Nigerian.

Return JSON: {"queries": ["q1", "q2", "q3", "q4"]}.`;
}

const REWRITER_TIMEOUT_MS = 12_000;

export async function buildSmartQueries(
  profile: BusinessProfile,
  userQuery: string
): Promise<string[]> {
  const fallback = templateDemandQueries(profile, userQuery);

  if (!env.openaiKeySafe()) return fallback;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REWRITER_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiKey()}`,
      },
      body: JSON.stringify({
        model: env.openaiModel(),
        messages: [
          { role: "system", content: REWRITER_SYSTEM },
          { role: "user", content: rewriterUser(profile, userQuery) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return fallback;
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const raw = Array.isArray(parsed.queries) ? parsed.queries : [];
    const cleaned = raw
      .map((q: any) => String(q ?? "").trim())
      .filter((q: string) => q.length > 0 && q.length <= 300)
      .slice(0, 5);
    return cleaned.length > 0 ? cleaned : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(t);
  }
}
