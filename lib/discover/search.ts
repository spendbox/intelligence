import { env } from "@/lib/env";
import {
  DEMAND_HINT_DOMAINS,
  SUPPLY_BLOCKLIST_DOMAINS,
} from "@/lib/discover/queries";

export type SearchHit = {
  title: string;
  url: string;
  content: string;
  published_date?: string | null;
};

const TAVILY_TIMEOUT_MS = 20_000;
const MAX_MERGED_HITS = 40;

async function tavilyRaw(query: string, opts: {
  includeDomains?: string[];
  excludeDomains?: string[];
}): Promise<SearchHit[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TAVILY_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.tavilyKey(),
        query,
        search_depth: "advanced",
        max_results: 8,
        include_answer: false,
        ...(opts.includeDomains?.length ? { include_domains: opts.includeDomains } : {}),
        ...(opts.excludeDomains?.length ? { exclude_domains: opts.excludeDomains } : {}),
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Tavily error: ${json?.error ?? res.statusText}`);
  const results: any[] = Array.isArray(json.results) ? json.results : [];
  return results
    .map((r) => ({
      title: String(r.title ?? "").slice(0, 240),
      url: String(r.url ?? ""),
      content: String(r.content ?? r.snippet ?? "").slice(0, 2000),
      published_date: r.published_date ?? null,
    }))
    .filter((r) => r.url);
}

// One query per intent yields two Tavily passes: a precision pass biased
// toward forums and social where humans post requests, and a broad pass
// that always blocks the big seller-listing aggregators. Hits are
// URL-deduped across passes.
export async function tavilySearch(query: string): Promise<SearchHit[]> {
  const [precision, broad] = await Promise.allSettled([
    tavilyRaw(query, {
      includeDomains: DEMAND_HINT_DOMAINS,
      excludeDomains: SUPPLY_BLOCKLIST_DOMAINS,
    }),
    tavilyRaw(query, { excludeDomains: SUPPLY_BLOCKLIST_DOMAINS }),
  ]);

  const seen = new Set<string>();
  const merged: SearchHit[] = [];
  for (const r of [precision, broad]) {
    if (r.status !== "fulfilled") continue;
    for (const hit of r.value) {
      if (seen.has(hit.url)) continue;
      seen.add(hit.url);
      merged.push(hit);
    }
  }
  return merged;
}

export async function searchMany(queries: string[]): Promise<SearchHit[]> {
  const batches = await Promise.allSettled(queries.map((q) => tavilySearch(q)));
  const seen = new Set<string>();
  const merged: SearchHit[] = [];
  for (const b of batches) {
    if (b.status !== "fulfilled") continue;
    for (const hit of b.value) {
      if (seen.has(hit.url)) continue;
      seen.add(hit.url);
      merged.push(hit);
      if (merged.length >= MAX_MERGED_HITS) return merged;
    }
  }
  return merged;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
