"use client";

import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: Variant;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {pending && <Spinner className="h-4 w-4" />}
      <span>{pending ? pendingLabel ?? "Working…" : children}</span>
    </button>
  );
}
