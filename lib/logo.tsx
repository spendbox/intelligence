type Props = { className?: string; titleId?: string };

// The Folio mark: rounded gradient square with a stylized "F".
// Used in the landing hero, headers, and to drive the favicons.
export function LogoMark({ className = "h-7 w-7", titleId }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby={titleId}
    >
      {titleId && <title id={titleId}>Folio</title>}
      <defs>
        <linearGradient id="folio-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#folio-mark-grad)" />
      <path
        d="M10 7.5h13.2v3.6h-8.6v4.1h7.4v3.6h-7.4v8.7H10z"
        fill="#fff"
      />
      <circle cx="23.6" cy="9.3" r="1.7" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export function LogoWordmark({ className = "text-lg" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span>Folio</span>
    </span>
  );
}
