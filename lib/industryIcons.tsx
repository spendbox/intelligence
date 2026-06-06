import type { ReactElement } from "react";

type IconProps = { className?: string };

const stroke = "currentColor";
const base = "h-6 w-6";

function Home({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
function Heart({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z" />
    </svg>
  );
}
function Book({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4z" />
      <path d="M4 4v16" />
    </svg>
  );
}
function Cpu({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  );
}
function Bag({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 8h14l-1 11a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}
function Coffee({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" />
      <path d="M17 10h2a2 2 0 010 4h-2" />
      <path d="M8 3c1 1.5-1 2.5 0 4M12 3c1 1.5-1 2.5 0 4" />
    </svg>
  );
}
function Sparkle({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
    </svg>
  );
}
function Bank({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-5 9 5" />
      <path d="M5 9v9M19 9v9M9 9v9M15 9v9" />
      <path d="M3 19h18" />
    </svg>
  );
}
function Leaf({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 20c0-9 6-15 15-15-1 9-6 15-15 15z" />
      <path d="M5 20c4-4 7-7 11-11" />
    </svg>
  );
}
function Truck({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}
function Camera({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function Plane({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15l-7-3 3-9-3 1-5 6-5-1-1 3 5 2 1 5 3-1 1-5z" />
    </svg>
  );
}
function Briefcase({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

const map: Record<string, (p: IconProps) => ReactElement> = {
  "real-estate": Home,
  health: Heart,
  education: Book,
  tech: Cpu,
  ecommerce: Bag,
  food: Coffee,
  fashion: Sparkle,
  finance: Bank,
  agriculture: Leaf,
  logistics: Truck,
  creative: Camera,
  hospitality: Plane,
};

export function IndustryIcon({ slug, className }: { slug: string; className?: string }) {
  const Cmp = map[slug] ?? Briefcase;
  return <Cmp className={className} />;
}
