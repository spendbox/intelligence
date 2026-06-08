"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Trigger = {
  label: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export default function ConfirmForm({
  action,
  hidden = [],
  trigger,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
}: {
  action: (formData: FormData) => Promise<void> | void;
  hidden?: { name: string; value: string }[];
  trigger: Trigger;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => confirmRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, close]);

  const confirmClass = danger
    ? "bg-rose-600 text-white hover:bg-rose-700"
    : "bg-brand text-white hover:bg-brand-dark";

  return (
    <>
      <form ref={formRef} action={action} className="contents">
        {hidden.map((h) => (
          <input key={h.name} type="hidden" name={h.name} value={h.value} />
        ))}
        <button
          type="button"
          aria-label={trigger.ariaLabel}
          onClick={() => setOpen(true)}
          className={trigger.className}
        >
          {trigger.label}
        </button>
      </form>

      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <div className="mt-2 text-sm text-slate-600">{message}</div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className={"rounded-lg px-4 py-2 text-sm font-semibold transition " + confirmClass}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
