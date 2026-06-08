"use client";

import { useRef, useTransition } from "react";
import { removeLogoAction, uploadLogoAction } from "./actions";

export default function LogoUploader({ currentUrl, fallbackInitial }: { currentUrl: string | null; fallbackInitial: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function onPick() {
    fileRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("logo", file);
    start(async () => {
      try {
        await uploadLogoAction(fd);
      } catch {}
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function onRemove() {
    if (typeof window !== "undefined" && !window.confirm("Remove your logo? You can upload a new one any time.")) return;
    start(async () => {
      try {
        await removeLogoAction();
      } catch {}
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4">
      <div className="relative">
        <div className={"grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition " + (pending ? "opacity-60" : "")}>
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-300">{(fallbackInitial || "F").slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        {pending && (
          <div className="absolute inset-0 grid place-items-center">
            <Spinner />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={pending}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Uploading…" : currentUrl ? "Change logo" : "Upload logo"}
        </button>
        {currentUrl && !pending && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
