import type { ReactElement } from "react";

type Props = { className?: string };
const base = "h-4 w-4";

function Globe({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}
function Instagram({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
function XTwitter({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2H21l-6.46 7.39L22 22h-6.81l-4.79-6.27L4.7 22H2l6.93-7.92L1.8 2h6.94l4.33 5.79L18.244 2zm-1.193 18h1.72L7.05 4H5.21l11.84 16z" />
    </svg>
  );
}
function Facebook({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5V9.4c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12H16l-.4 2.9h-2.1v7A10 10 0 0022 12z" />
    </svg>
  );
}
function Linkedin({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.6 0h4.37v1.93h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.48 3.04 5.48 6.99V22h-4.56v-6.18c0-1.47-.03-3.36-2.05-3.36-2.06 0-2.37 1.6-2.37 3.26V22H7.82V8z" />
    </svg>
  );
}
function TikTok({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.6 6.5a5.6 5.6 0 01-3.3-1.1V15a5.7 5.7 0 11-5.7-5.7c.3 0 .6 0 .9.1v3a2.7 2.7 0 102 2.6V2h2.9a5.6 5.6 0 003.2 4.5V6.5z" />
    </svg>
  );
}
function WhatsApp({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.5 3.5A10 10 0 003.4 17l-1.4 5 5.2-1.4a10 10 0 0013.3-17.1zM12 20a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-3-.2-.3A8 8 0 1112 20zm4.5-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4 0-.1 0-.3-.1-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z" />
    </svg>
  );
}
function YouTube({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.5 6.4a3 3 0 00-2.1-2.1C18.6 4 12 4 12 4s-6.6 0-8.4.3a3 3 0 00-2.1 2.1A31 31 0 001 12a31 31 0 00.5 5.6 3 3 0 002.1 2.1C5.4 20 12 20 12 20s6.6 0 8.4-.3a3 3 0 002.1-2.1A31 31 0 0023 12a31 31 0 00-.5-5.6zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

const ICONS: Record<string, (p: Props) => ReactElement> = {
  website: Globe,
  instagram: Instagram,
  twitter: XTwitter,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: TikTok,
  whatsapp: WhatsApp,
  youtube: YouTube,
};

export type SocialKey = "website" | "instagram" | "twitter" | "facebook" | "linkedin" | "tiktok" | "whatsapp" | "youtube";

export function SocialIcon({ kind, className }: { kind: SocialKey; className?: string }) {
  const Cmp = ICONS[kind] ?? Globe;
  return <Cmp className={className} />;
}

export type Social = { key: SocialKey; label: string; href: string };

function normalizeUrl(input: string | null | undefined, prefix?: (h: string) => string): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@") && prefix) return prefix(v.slice(1));
  if (prefix) return prefix(v.replace(/^\//, ""));
  return `https://${v}`;
}

export function buildSocials(b: any): Social[] {
  const out: Social[] = [];
  const website = normalizeUrl(b.website);
  if (website) out.push({ key: "website", label: "Website", href: website });
  const ig = normalizeUrl(b.instagram, (h) => `https://instagram.com/${h}`);
  if (ig) out.push({ key: "instagram", label: "Instagram", href: ig });
  const tw = normalizeUrl(b.twitter, (h) => `https://x.com/${h}`);
  if (tw) out.push({ key: "twitter", label: "X", href: tw });
  const tk = normalizeUrl(b.tiktok, (h) => `https://tiktok.com/@${h}`);
  if (tk) out.push({ key: "tiktok", label: "TikTok", href: tk });
  const fb = normalizeUrl(b.facebook, (h) => `https://facebook.com/${h}`);
  if (fb) out.push({ key: "facebook", label: "Facebook", href: fb });
  const li = normalizeUrl(b.linkedin, (h) => `https://linkedin.com/${h}`);
  if (li) out.push({ key: "linkedin", label: "LinkedIn", href: li });
  if (b.whatsapp) {
    const num = String(b.whatsapp).replace(/[^\d]/g, "");
    if (num) out.push({ key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${num}` });
  }
  return out;
}
