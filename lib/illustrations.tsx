// Animated Folio illustrations. Pure SVG + CSS — no JS runtime needed.

export function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* Backdrop glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-3xl animate-float-slow" />
      </div>

      {/* Connection path with a traveling dot */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>
        <path
          d="M 110 200 C 180 100, 260 100, 320 150"
          stroke="url(#flow-grad)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle r="4" fill="#ffffff">
          <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#flow-path" />
          </animateMotion>
        </circle>
        <path id="flow-path" d="M 110 200 C 180 100, 260 100, 320 150" fill="none" />
      </svg>

      {/* Card 1: customer request */}
      <div className="absolute left-0 top-[28%] w-[58%] -rotate-[5deg] rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_20px_60px_-12px_rgba(124,58,237,0.45)] backdrop-blur-md animate-float-slow">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light">Request</p>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">live</span>
        </div>
        <p className="mt-2 text-sm font-medium leading-snug text-white">
          3-bedroom flat in Lekki Phase 1, 12 months.
        </p>
        <p className="mt-1 text-[11px] text-white/60">₦5–8m/yr · Lagos · 14m ago</p>
      </div>

      {/* Card 2: matched business */}
      <div className="absolute right-0 top-[6%] w-[58%] rotate-[4deg] rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/30 to-fuchsia-500/20 p-4 shadow-[0_20px_60px_-12px_rgba(232,121,249,0.55)] backdrop-blur-md animate-float-slower">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">Matched</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
              <path d="M12 2l2 4 4 .5-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-.5z" />
            </svg>
            Verified
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-rose-400 text-xs font-bold text-white">
            L
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Lagos Living Realty</p>
            <p className="truncate text-[11px] text-white/70">Real Estate · Lekki, Lagos</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-white/10 px-2 py-1 text-[11px]">
          <span className="text-white/70">Unlock</span>
          <span className="font-semibold text-white">10 credits</span>
        </div>
      </div>

      {/* Card 3: notifications */}
      <div className="absolute bottom-[10%] left-[14%] w-[68%] rotate-[1.5deg] rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-md animate-float-slow">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Notifications</p>
        <ul className="mt-2 space-y-1.5 text-[11px]">
          <li className="flex items-center gap-2 text-white/80">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
            </span>
            2 new lead matches today
          </li>
          <li className="flex items-center gap-2 text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            +500 credits added to your wallet
          </li>
          <li className="flex items-center gap-2 text-white/80">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            "Lagos Living Realty" got a 5★ review
          </li>
        </ul>
      </div>
    </div>
  );
}

// Compact 3-step flow used on /login and "How it works" section.
export function FlowIllustration({ small = false }: { small?: boolean }) {
  const size = small ? "h-44 sm:h-52" : "h-64 sm:h-72";
  return (
    <div className={`relative mx-auto w-full ${size}`}>
      <svg aria-hidden viewBox="0 0 360 200" className="h-full w-full">
        <defs>
          <linearGradient id="flow2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>

        {/* dashed connectors */}
        <path id="step-1-2" d="M 90 100 C 130 60, 160 60, 180 100" stroke="url(#flow2)" strokeWidth="2" strokeDasharray="4 6" fill="none" opacity="0.55" />
        <path id="step-2-3" d="M 180 100 C 200 140, 230 140, 270 100" stroke="url(#flow2)" strokeWidth="2" strokeDasharray="4 6" fill="none" opacity="0.55" />

        {/* node circles */}
        <g>
          <circle cx="90" cy="100" r="28" fill="white" opacity="0.06" />
          <circle cx="90" cy="100" r="22" fill="white" opacity="0.12" />
        </g>
        <g>
          <circle cx="180" cy="100" r="32" fill="white" opacity="0.08" />
          <circle cx="180" cy="100" r="26" fill="url(#flow2)" opacity="0.85" />
        </g>
        <g>
          <circle cx="270" cy="100" r="28" fill="white" opacity="0.06" />
          <circle cx="270" cy="100" r="22" fill="white" opacity="0.12" />
        </g>

        {/* travelling dot */}
        <circle r="4" fill="#fff">
          <animateMotion dur="3s" repeatCount="indefinite" rotate="auto" path="M 90 100 C 130 60, 160 60, 180 100 C 200 140, 230 140, 270 100" />
        </circle>

        {/* Icons inside nodes */}
        {/* customer */}
        <g transform="translate(90 100)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="0" cy="-3" r="4.5" />
          <path d="M -7 9 a 7 7 0 0 1 14 0" />
        </g>
        {/* link / match icon — interlocking circles */}
        <g transform="translate(180 100)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-7 0 a 4 4 0 0 1 4 -4 h 3" />
          <path d="M7 0 a 4 4 0 0 1 -4 4 h -3" />
          <line x1="-4" y1="0" x2="4" y2="0" />
        </g>
        {/* business */}
        <g transform="translate(270 100)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="-7" y="-6" width="14" height="11" rx="2" />
          <path d="M -3 -6 V -9 a 1 1 0 0 1 1 -1 h 4 a 1 1 0 0 1 1 1 V -6" />
        </g>

        {/* labels */}
        <g fontFamily="ui-sans-serif, system-ui" fontSize="11" fill="rgba(255,255,255,0.7)">
          <text x="90" y="148" textAnchor="middle">Post request</text>
          <text x="180" y="148" textAnchor="middle">Matched</text>
          <text x="270" y="148" textAnchor="middle">Business reaches out</text>
        </g>
      </svg>
    </div>
  );
}

// Decorative wallet illustration for the pricing card
export function WalletIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="wallet-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <rect x="14" y="30" width="92" height="58" rx="10" fill="url(#wallet-grad)" opacity="0.95" />
      <rect x="14" y="30" width="92" height="58" rx="10" fill="none" stroke="rgba(0,0,0,0.05)" />
      <rect x="76" y="50" width="28" height="18" rx="6" fill="rgba(255,255,255,0.18)" />
      <circle cx="92" cy="59" r="4" fill="white" />
      <g transform="translate(0 0)">
        <circle cx="34" cy="22" r="10" fill="#fbbf24" />
        <text x="34" y="26" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="11" fill="#92400e">₦</text>
      </g>
      <g transform="translate(20 0)">
        <circle cx="34" cy="14" r="8" fill="#fcd34d" opacity="0.9" />
        <text x="34" y="17" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="700" fontSize="9" fill="#92400e">₦</text>
      </g>
    </svg>
  );
}

// Decorative "request" stack illustration for the customer flow card
export function StackIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="stack-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <rect x="20" y="22" width="72" height="46" rx="8" fill="white" stroke="#e2e8f0" />
      <rect x="14" y="32" width="72" height="46" rx="8" fill="white" stroke="#e2e8f0" />
      <rect x="8" y="42" width="72" height="46" rx="8" fill="url(#stack-grad)" />
      <rect x="16" y="50" width="40" height="4" rx="2" fill="white" opacity="0.85" />
      <rect x="16" y="58" width="56" height="4" rx="2" fill="white" opacity="0.55" />
      <rect x="16" y="66" width="30" height="4" rx="2" fill="white" opacity="0.35" />
    </svg>
  );
}
