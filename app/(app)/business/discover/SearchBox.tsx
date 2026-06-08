"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { runDiscoveryScanAction } from "./actions";

function ScanButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={
        "rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition " +
        (isDisabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-brand text-white hover:bg-brand-dark")
      }
    >
      {pending ? "Scanning the web…" : "Scan the web"}
    </button>
  );
}

export default function DiscoverSearchBox({
  defaultQuery,
  cost,
  credits,
  disabled,
  suggestions,
}: {
  defaultQuery: string;
  cost: number;
  credits: number;
  disabled: boolean;
  suggestions: string[];
}) {
  const [value, setValue] = useState(defaultQuery);

  return (
    <form action={runDiscoveryScanAction} className="mt-8 w-full">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-md focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-slate-400">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" strokeLinecap="round" />
        </svg>
        <input
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="What kind of lead are you looking for?"
          className="flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-slate-400"
          maxLength={240}
        />
        <ScanButton disabled={disabled} />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValue(s)}
            className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600 hover:border-brand/40 hover:text-brand"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
