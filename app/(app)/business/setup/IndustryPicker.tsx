"use client";

import { useState } from "react";

type Industry = { id: string; name: string };

export default function IndustryPicker({ industries, initial }: { industries: Industry[]; initial: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const cap = 3;
  const full = selected.size >= cap;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < cap) next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {industries.map((c) => {
          const checked = selected.has(c.id);
          const locked = !checked && full;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !locked && toggle(c.id)}
              aria-pressed={checked}
              disabled={locked}
              className={
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition " +
                (checked
                  ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                  : locked
                  ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                  : "border-slate-200 bg-white hover:bg-slate-50")
              }
            >
              <span className="flex items-center gap-2">
                <span
                  className={
                    "grid h-4 w-4 place-items-center rounded border " +
                    (checked ? "border-brand bg-brand text-white" : "border-slate-300 bg-white")
                  }
                  aria-hidden
                >
                  {checked && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {c.name}
              </span>
              {locked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        <span className={full ? "text-brand font-semibold" : ""}>{selected.size}</span> / {cap} selected
        {full ? " — others are locked." : ""}
      </p>

      {/* hidden inputs so the parent form picks up the selection */}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="category" value={id} />
      ))}
    </>
  );
}
