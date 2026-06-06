import { env } from "@/lib/env";

type Out = { subject: string; body_md: string };

async function chatJson(messages: { role: "system" | "user"; content: string }[]): Promise<Out> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiKey()}`,
    },
    body: JSON.stringify({
      model: env.openaiModel(),
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
    cache: "no-store",
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(`OpenAI error: ${json?.error?.message ?? res.statusText}`);
  const content: string = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned non-JSON content");
  }
  const subject = String(parsed.subject ?? "").trim();
  const body_md = String(parsed.body_md ?? parsed.body ?? "").trim();
  if (!subject || !body_md) throw new Error("OpenAI response missing subject or body");
  return { subject, body_md };
}

const SYSTEM = `You are an expert business intelligence writer for small businesses.
You produce concise, scannable monthly insight emails that are immediately actionable.
You write in clear, confident prose. You avoid filler, hedging and emojis.
You always return valid JSON with two keys: "subject" (string, <=80 chars) and "body_md" (markdown string).`;

export async function generateInsight(opts: {
  industryName: string;
  industryDescription?: string | null;
  monthLabel?: string;
}): Promise<Out> {
  const month = opts.monthLabel ?? new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const userMsg = `Industry: ${opts.industryName}
${opts.industryDescription ? `Context: ${opts.industryDescription}\n` : ""}Month: ${month}

Write a monthly insight email for small businesses in this industry. Include these markdown sections:

## What's changing this month
A 2-3 sentence framing of the most important shift.

## 3-5 actionable insights
A numbered list. Each item has a bold one-line title, then a sentence on what to do this week.

## New business ideas
Two concrete opportunities a small business in this industry could test in the next 30 days.

## Cut costs
Two specific ways to reduce expenses without hurting growth.

## Improve profit
Two pricing, retention or upsell tactics with expected impact.

## Customer leads
Two example customer or partner email outreach scripts they can copy and send today.

Tone: confident, practical, specific. No emojis. Use bold and bullet lists for scannability.`;

  return chatJson([
    { role: "system", content: SYSTEM },
    { role: "user", content: userMsg },
  ]);
}

export async function polishDraft(opts: {
  industryName: string;
  subject: string;
  body_md: string;
}): Promise<Out> {
  const userMsg = `Industry: ${opts.industryName}

You are given a draft insight email. Rewrite it to be more scannable, more specific, and more actionable. Keep the same intent but improve clarity, tone and structure. Ensure it has clearly labelled markdown sections, bold sub-headings inside numbered lists, and short paragraphs. Do not invent statistics that look exact (no fake percentages).

Existing subject:
${opts.subject}

Existing body (markdown):
${opts.body_md}`;

  return chatJson([
    { role: "system", content: SYSTEM },
    { role: "user", content: userMsg },
  ]);
}
