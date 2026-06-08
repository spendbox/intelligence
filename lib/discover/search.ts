import { env } from "@/lib/env";

export type SearchHit = {
  title: string;
  url: string;
  content: string;
  published_date?: string | null;
};

export async function tavilySearch(query: string): Promise<SearchHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: env.tavilyKey(),
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
    }),
    cache: "no-store",
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(`Tavily error: ${json?.error ?? res.statusText}`);
  const results: any[] = Array.isArray(json.results) ? json.results : [];
  return results.map((r) => ({
    title: String(r.title ?? "").slice(0, 240),
    url: String(r.url ?? ""),
    content: String(r.content ?? r.snippet ?? "").slice(0, 2000),
    published_date: r.published_date ?? null,
  })).filter((r) => r.url);
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
