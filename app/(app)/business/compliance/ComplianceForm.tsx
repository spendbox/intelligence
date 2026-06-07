"use client";

import { useRef, useState, useTransition } from "react";
import { saveComplianceAction, submitComplianceAction, uploadComplianceFileAction } from "./actions";

type Initial = { kind: "business" | "individual"; legal_name: string; registration_number: string; nin: string };

export default function ComplianceForm({
  initial,
  idDocumentUrl,
  registrationDocumentUrl,
  hasGalleryImage,
  hasLogo,
  status,
}: {
  initial: Initial;
  idDocumentUrl: string | null;
  registrationDocumentUrl: string | null;
  hasGalleryImage: boolean;
  hasLogo: boolean;
  status: "unsubmitted" | "pending" | "approved" | "rejected" | null;
}) {
  const [kind, setKind] = useState<"business" | "individual">(initial.kind);
  const [legalName, setLegalName] = useState(initial.legal_name);
  const [rcNumber, setRcNumber] = useState(initial.registration_number);
  const [nin, setNin] = useState(initial.nin);

  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const regRef = useRef<HTMLInputElement>(null);

  function autoSave() {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("legal_name", legalName);
    fd.set("registration_number", rcNumber);
    fd.set("nin", nin);
    start(async () => {
      try {
        await saveComplianceAction(fd);
      } catch {}
    });
  }

  function uploadFile(field: "id_document" | "registration_document", file: File) {
    setBusyKey(field);
    const fd = new FormData();
    fd.set("field", field);
    fd.append("file", file);
    start(async () => {
      try {
        await uploadComplianceFileAction(fd);
      } catch {}
      setBusyKey(null);
    });
  }

  function submit() {
    const fd = new FormData();
    start(async () => {
      try {
        await submitComplianceAction(fd);
      } catch {}
    });
  }

  const checklist = buildChecklist({
    kind,
    legalName,
    rcNumber,
    nin,
    idDocumentUrl,
    registrationDocumentUrl,
    hasGalleryImage,
    hasLogo,
  });

  const allGood = checklist.every((c) => c.done);
  const locked = status === "pending" || status === "approved";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">I am applying as a</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["business", "individual"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setKind(k); autoSave(); }}
              disabled={locked}
              className={
                "rounded-lg border px-3 py-3 text-sm font-medium capitalize transition " +
                (kind === k ? "border-brand bg-brand/5 ring-1 ring-brand/20" : "border-slate-200 bg-white hover:bg-slate-50") +
                (locked ? " opacity-60 cursor-not-allowed" : "")
              }
            >
              {k === "business" ? "Business entity (Ltd / BN)" : "Individual / sole owner"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Identification</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              {kind === "business" ? "Registered name (as on CAC)" : "Full name (as on government ID)"}
            </label>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              onBlur={autoSave}
              disabled={locked}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
          {kind === "business" ? (
            <div>
              <label className="text-sm font-medium">CAC RC / BN number</label>
              <input
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                onBlur={autoSave}
                disabled={locked}
                placeholder="RC123456 or BN1234567"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">NIN</label>
              <input
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                onBlur={autoSave}
                disabled={locked}
                placeholder="11-digit National ID Number"
                maxLength={11}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Documents</h2>
        <p className="mt-1 text-xs text-slate-500">JPG/PNG/PDF, max 5MB. Uploads automatically.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <UploadCard
            label="Government ID (NIN slip / Driver's license / Passport)"
            currentUrl={idDocumentUrl}
            busy={busyKey === "id_document"}
            disabled={locked}
            onPick={() => idRef.current?.click()}
          />
          <input
            ref={idRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile("id_document", f);
              if (idRef.current) idRef.current.value = "";
            }}
          />

          {kind === "business" && (
            <>
              <UploadCard
                label="CAC certificate (or status report)"
                currentUrl={registrationDocumentUrl}
                busy={busyKey === "registration_document"}
                disabled={locked}
                onPick={() => regRef.current?.click()}
              />
              <input
                ref={regRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile("registration_document", f);
                  if (regRef.current) regRef.current.value = "";
                }}
              />
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Checklist</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-start gap-2">
              <span
                className={
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full " +
                  (c.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")
                }
              >
                {c.done ? "✓" : "•"}
              </span>
              <span className={c.done ? "text-slate-800" : "text-slate-600"}>{c.label}</span>
            </li>
          ))}
        </ul>

        {!locked && (
          <button
            type="button"
            onClick={submit}
            disabled={!allGood || pending}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Working…" : "Submit for review"}
          </button>
        )}
        {locked && status === "pending" && (
          <p className="mt-3 text-xs text-amber-700">Under review — we'll email you when there's an update.</p>
        )}
      </section>
    </div>
  );
}

function buildChecklist(p: {
  kind: "business" | "individual";
  legalName: string;
  rcNumber: string;
  nin: string;
  idDocumentUrl: string | null;
  registrationDocumentUrl: string | null;
  hasGalleryImage: boolean;
  hasLogo: boolean;
}) {
  const out: { key: string; label: string; done: boolean }[] = [];
  out.push({ key: "name", label: p.kind === "business" ? "Registered business name" : "Full legal name", done: p.legalName.trim().length >= 2 });
  if (p.kind === "business") {
    out.push({ key: "rc", label: "CAC RC or BN number", done: p.rcNumber.trim().length >= 4 });
    out.push({ key: "reg_doc", label: "CAC certificate uploaded", done: !!p.registrationDocumentUrl });
  } else {
    out.push({ key: "nin", label: "NIN (11 digits)", done: /^\d{11}$/.test(p.nin.trim()) });
  }
  out.push({ key: "id_doc", label: "Government ID uploaded", done: !!p.idDocumentUrl });
  out.push({ key: "logo", label: "Business logo uploaded", done: p.hasLogo });
  out.push({ key: "gallery", label: "At least one gallery image", done: p.hasGalleryImage });
  return out;
}

function UploadCard({
  label,
  currentUrl,
  busy,
  disabled,
  onPick,
}: {
  label: string;
  currentUrl: string | null;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled || busy}
      className="group flex items-start justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-100 disabled:opacity-60"
    >
      <div className="min-w-0">
        <p className="font-medium text-slate-800">{label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {busy ? "Uploading…" : currentUrl ? "Uploaded ✓ · click to replace" : "Click to upload"}
        </p>
      </div>
      {currentUrl ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Done</span>
      ) : busy ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Working…</span>
      ) : (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Missing</span>
      )}
    </button>
  );
}
