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

const SYSTEM = `You qualify web search results into BUYER LEADS for a small
business on Folio. Every business on Folio is a seller / service provider;
they want to find the OPPOSITE side of the market — people who want to
buy, rent, hire, commission, or otherwise BE THE CUSTOMER.

Classify every result as exactly one of:
- "demand": the author is a real person seeking, asking for, wanting,
  hiring, looking to buy/rent/commission a service or product. Examples:
  Nairaland threads asking for a property, Reddit posts asking for a
  recommendation, X/Twitter posts saying "DM if you know a wedding
  photographer", an RFP, a job listing where the poster is the buyer.
- "supply": the author is offering, listing, advertising, or selling. This
  includes property listings, agency homepages, e-commerce pages,
  freelancer portfolios, "for sale" posts, services marketplaces, and
  category pages.

REJECT every "supply" result, no matter how relevant its topic. Also
reject news articles, generic guides, directory pages, and pages where
the author cannot be identified as a buyer in their own words.

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

  return `Business profile (they are the SELLER):
${profileSummary}

Search results:
${numbered}

For each result, classify side and (only if "demand") output an object with:
- "source_url": the URL exactly as given
- "side": "demand" or "supply"
- "title": a short, human title (<=120 chars)
- "summary": 1–2 sentences explaining what the buyer is asking for
- "location": the location mentioned, or null
- "budget_hint": any money/budget mentioned, or null
- "contact_hint": e.g. "Apply on site", "Reply on thread", an email, or null
- "posted_at": ISO 8601 if a date is given, else null
- "signal": short phrase(s) from the post that prove it's a buyer, e.g.
  ["looking for", "budget 5m"]
- "score": 0.0–1.0 — how strong this BUYER lead is for the seller profile

Drop "supply" entirely. Drop "demand" results with score < 0.5. Return at
most 20 leads. Return JSON: {"leads": [...]}.`;
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
        temperature: 0.1,
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
    .map((r): (ExtractedLead & { side: string }) | null => {
      const url = String(r.source_url ?? "");
      if (!allowed.has(url)) return null;
      const title = String(r.title ?? "").trim().slice(0, 240);
      if (!title) return null;
      const score = Number(r.score);
      const side = String(r.side ?? "").toLowerCase();
      return {
        source_url: url,
        side,
        title,
        summary: String(r.summary ?? "").trim().slice(0, 600),
        location: r.location ? String(r.location).slice(0, 120) : null,
        budget_hint: r.budget_hint ? String(r.budget_hint).slice(0, 120) : null,
        contact_hint: r.contact_hint ? String(r.contact_hint).slice(0, 240) : null,
        posted_at: r.posted_at ? String(r.posted_at) : null,
        score: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0,
      };
    })
    .filter((x): x is ExtractedLead & { side: string } =>
      x !== null && x.side === "demand" && x.score >= 0.5
    )
    .map(({ side: _side, ...rest }) => rest);
}
