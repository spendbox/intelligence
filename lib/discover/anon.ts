import { searchMany, domainOf } from "@/lib/discover/search";
import { extractLeads } from "@/lib/discover/extract";
import { buildSmartQueries, type BusinessProfile } from "@/lib/discover/queries";

export type AnonLead = {
  title: string;
  summary: string;
  source_domain: string;
  location: string | null;
  budget_hint: string | null;
  score: number;
};

// A free, anonymous teaser scan for the landing page. Runs demand-side
// queries and returns leads with their actionable details (source URL,
// contact) stripped — those only ever exist server-side and are never sent
// to an anonymous browser. Visitors must sign in and spend credits to
// reveal them.
export async function anonymousDiscover(query: string): Promise<AnonLead[]> {
  const q = query.trim().slice(0, 240);
  if (!q) return [];

  const profile: BusinessProfile = { industries: [], locations: [], budgets: [], bio: null };
  const queries = await buildSmartQueries(profile, q);
  const hits = await searchMany(queries);
  const leads = await extractLeads(profile, hits);

  return leads.slice(0, 8).map((l) => ({
    title: l.title,
    summary: l.summary,
    source_domain: domainOf(l.source_url),
    location: l.location,
    budget_hint: l.budget_hint,
    score: l.score,
  }));
}
