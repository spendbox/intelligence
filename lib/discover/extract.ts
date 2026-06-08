import { env } from "@/lib/env";
import type { SearchHit } from "@/lib/discover/search";
import type { BusinessProfile } from "@/lib/discover/queries";

export type ExtractedLead = {
  source_url: string;
  title: string;
  summary: string;
  location: string | null;
  budget_hint: string | null;
  contact_hint: string | null;
  posted_at: string | null;
  score: number;
};

const SYSTEM = `You are a lead-qualification assistant for small businesses.
You are given a business profile and a batch of public web search results.
Identify the ones that look like a real opportunity for that business to
respond to — a customer asking for the service, a job/RFP listing, a
request-for-quote, a public callout, etc. Reject company directory pages,
news articles, generic guides and unrelated content.
Always return valid JSON: {"leads":[{...}, ...]}.`;

function buildUserMsg(profile: BusinessProfile, hits: SearchHit[]): string {
  const profileSummary = [
    `Industries: ${profile.industries.join(", ") || "—"}`,
    `Locations served: ${profile.locations.join(", ") || "—"}`,
    profile.budgets[0]
      ? `Budget range: ${profile.budgets[0].min}–${profile.budgets[0].max}`
      : "Budget range: —",
    profile.bio ? `About: ${profile.bio.slice(0, 400)}` : "",
  ].filter(Boolean).join("\n");

  const numbered = hits.slice(0, 40).map((h, i) => {
    return `[${i + 1}] URL: ${h.url}
Title: ${h.title}
Published: ${h.published_date ?? "unknown"}
Content: ${h.content.slice(0, 1200)}`;
  }).join("\n\n");

  return `Business profile:
${profileSummary}

Search results:
${numbered}

For each result that looks like a real opportunity, output an object with:
- "source_url": the URL exactly as given
- "title": a short, human title (<=120 chars)
- "summary": one or two sentences explaining what the opportunity is
- "location": the location mentioned, or null
- "budget_hint": any money/budget mentioned, or null
- "contact_hint": e.g. "Apply on site", an email, or null
- "posted_at": ISO 8601 if a date is given, else null
- "score": 0.0–1.0 — how strong this lead is for the profile above

Drop irrelevant results entirely. Return at most 20 leads.
Return JSON: {"leads": [...]}.`;
}

export async function extractLeads(
  profile: BusinessProfile,
  hits: SearchHit[]
): Promise<ExtractedLead[]> {
  if (hits.length === 0) return [];

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45_000);
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiKey()}`,
      },
      body: JSON.stringify({
        model: env.openaiModel(),
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildUserMsg(profile, hits) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI error: ${json?.error?.message ?? res.statusText}`);
  const content: string = json.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  const raw: any[] = Array.isArray(parsed.leads) ? parsed.leads : [];
  const allowed = new Set(hits.map((h) => h.url));

  return raw
    .map((r): ExtractedLead | null => {
      const url = String(r.source_url ?? "");
      if (!allowed.has(url)) return null;
      const title = String(r.title ?? "").trim().slice(0, 240);
      if (!title) return null;
      const score = Number(r.score);
      return {
        source_url: url,
        title,
        summary: String(r.summary ?? "").trim().slice(0, 600),
        location: r.location ? String(r.location).slice(0, 120) : null,
        budget_hint: r.budget_hint ? String(r.budget_hint).slice(0, 120) : null,
        contact_hint: r.contact_hint ? String(r.contact_hint).slice(0, 240) : null,
        posted_at: r.posted_at ? String(r.posted_at) : null,
        score: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0,
      };
    })
    .filter((x): x is ExtractedLead => x !== null && x.score >= 0.35);
}
