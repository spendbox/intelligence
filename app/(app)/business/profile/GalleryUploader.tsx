"use client";

import { useRef, useState, useTransition } from "react";
import { deleteGalleryItemAction, uploadGalleryAction } from "./actions";

type Item = { id: string; url: string; caption: string | null };

export default function GalleryUploader({ items, capRemaining }: { items: Item[]; capRemaining: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [pendingCount, setPendingCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function onPick() {
    fileRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    setPendingCount(files.length);
    start(async () => {
      try {
        await uploadGalleryAction(fd);
      } catch {}
      if (fileRef.current) fileRef.current.value = "";
      setPendingCount(0);
    });
  }

  function onDelete(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this image from your gallery? This can't be undone.")) return;
    setDeletingId(id);
    const fd = new FormData();
    fd.append("id", id);
    start(async () => {
      try {
        await deleteGalleryItemAction(fd);
      } catch {}
      setDeletingId(null);
    });
  }

  const disabled = capRemaining <= 0 || pending;

  return (
    <div className="mt-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending && pendingCount > 0
            ? `Uploading ${pendingCount} image${pendingCount === 1 ? "" : "s"}…`
            : capRemaining <= 0
            ? "Gallery full"
            : "Add images"}
        </button>
        <span className="text-xs text-slate-500">
          {items.length} of {items.length + capRemaining} used
        </span>
      </div>

      {(items.length > 0 || pending) && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((g) => (
            <li
              key={g.id}
              className={
                "group relative overflow-hidden rounded-xl border border-slate-200 transition " +
                (deletingId === g.id ? "opacity-40" : "")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption ?? ""} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => onDelete(g.id)}
                disabled={pending}
                className="absolute right-2 top-2 rounded-full bg-rose-600/90 px-2 py-1 text-xs font-medium text-white shadow opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
              >
                Delete
              </button>
            </li>
          ))}
          {pending && pendingCount > 0 &&
            Array.from({ length: pendingCount }).map((_, i) => (
              <li key={`skel-${i}`} className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <Spinner />
              </li>
            ))}
        </ul>
      )}
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
