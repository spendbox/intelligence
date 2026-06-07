"use client";

import { useEffect, useRef, useState } from "react";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type State = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SlugField({
  initial,
  publicBase,
  value,
  onChange,
}: {
  initial: string;
  publicBase: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const controlled = value !== undefined;
  const [innerSlug, setInnerSlug] = useState(initial);
  const slug = controlled ? (value ?? "") : innerSlug;
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!slug) {
      setState("idle");
      return;
    }
    if (slug.length < 3 || slug.length > 60 || !SLUG_RE.test(slug)) {
      setState("invalid");
      return;
    }
    if (slug === initial) {
      setState("available");
      return;
    }
    setState("checking");
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/business/slug-check?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();
        setState(json.available ? "available" : "taken");
      } catch {
        setState("idle");
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [slug, initial]);

  const msg = {
    idle: "",
    checking: "Checking…",
    available: "Available",
    taken: "Already taken",
    invalid: "3-60 chars, lowercase letters, digits and dashes.",
  }[state];

  const color = {
    idle: "text-slate-500",
    checking: "text-slate-500",
    available: "text-emerald-600",
    taken: "text-rose-600",
    invalid: "text-rose-600",
  }[state];

  function set(v: string) {
    const next = v.toLowerCase();
    if (controlled) onChange?.(next);
    else setInnerSlug(next);
  }

  return (
    <div>
      <label className="text-sm font-medium">Your URL</label>
      <div className="mt-1 flex rounded-lg border border-slate-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span className="flex items-center px-3 text-sm text-slate-500">{publicBase}/b/</span>
        <input
          name="slug"
          value={slug}
          onChange={(e) => set(e.target.value)}
          required
          minLength={3}
          maxLength={60}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="w-full rounded-r-lg px-3 py-2 text-sm outline-none"
        />
      </div>
      <p className={`mt-1 text-xs ${color}`}>{msg}</p>
    </div>
  );
}
