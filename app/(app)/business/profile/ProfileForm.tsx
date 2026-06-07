"use client";

import { useEffect, useRef, useState } from "react";
import SlugField from "./SlugField";
import { autoSaveProfileAction } from "./actions";

type Initial = {
  business_name: string;
  display_name: string;
  phone: string;
  bio: string;
  slug: string;
  website: string;
  instagram: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  whatsapp: string;
};

const COUNTRY_CODES = [
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US" },
];

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: number } | { kind: "error"; msg: string };

// Split a WhatsApp E.164 string into its country code + local part.
function splitWhatsapp(value: string): { country: string; local: string } {
  const v = String(value || "").trim();
  if (!v) return { country: "+234", local: "" };
  for (const c of COUNTRY_CODES) {
    if (v.startsWith(c.code)) return { country: c.code, local: v.slice(c.code.length).replace(/[^\d]/g, "") };
  }
  if (v.startsWith("+")) return { country: "+234", local: v.replace(/[^\d]/g, "") };
  return { country: "+234", local: v.replace(/[^\d]/g, "") };
}

function splitPhone(value: string) {
  return splitWhatsapp(value);
}

export default function ProfileForm({ initial, publicBase }: { initial: Initial; publicBase: string }) {
  const [values, setValues] = useState<Initial>(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreFirst = useRef(true);

  const phoneSplit = splitPhone(values.phone);
  const [phoneCountry, setPhoneCountry] = useState(phoneSplit.country);
  const [phoneLocal, setPhoneLocal] = useState(phoneSplit.local);

  const waSplit = splitWhatsapp(values.whatsapp);
  const [waCountry, setWaCountry] = useState(waSplit.country);
  const [waLocal, setWaLocal] = useState(waSplit.local);

  useEffect(() => {
    if (ignoreFirst.current) {
      ignoreFirst.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    setStatus({ kind: "saving" });
    debounce.current = setTimeout(async () => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ""));
      try {
        const r = await autoSaveProfileAction(fd);
        if (!r.ok) {
          setStatus({
            kind: "error",
            msg:
              r.error === "slug_taken"
                ? "URL is taken"
                : r.error === "invalid"
                ? "Check your inputs"
                : "Couldn't save",
          });
          return;
        }
        setStatus({ kind: "saved", at: Date.now() });
        setTimeout(() => setStatus((s) => (s.kind === "saved" ? { kind: "idle" } : s)), 1500);
      } catch {
        setStatus({ kind: "error", msg: "Network issue" });
      }
    }, 700);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  function update<K extends keyof Initial>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function setPhoneFromInputs(country: string, local: string) {
    setPhoneCountry(country);
    setPhoneLocal(local);
    update("phone", local ? `${country}${local}` : "");
  }
  function setWaFromInputs(country: string, local: string) {
    setWaCountry(country);
    setWaLocal(local);
    update("whatsapp", local ? `${country}${local}` : "");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Public profile</h2>
        <SaveBadge status={status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name" value={values.business_name} onChange={(v) => update("business_name", v)} />
        <Field label="Display name" value={values.display_name} onChange={(v) => update("display_name", v)} />
        <PhoneField
          label="Phone"
          country={phoneCountry}
          local={phoneLocal}
          onCountry={(c) => setPhoneFromInputs(c, phoneLocal)}
          onLocal={(v) => setPhoneFromInputs(phoneCountry, v)}
          placeholder="8012345678"
        />
      </div>

      <SlugField initial={initial.slug} publicBase={publicBase} value={values.slug} onChange={(v) => update("slug", v)} />

      <div>
        <label className="text-sm font-medium">About</label>
        <textarea
          rows={4}
          value={values.bio}
          onChange={(e) => update("bio", e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold">Socials & links</h3>
        <p className="mt-1 text-xs text-slate-500">All optional. Will show on your public page.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Website" value={values.website} onChange={(v) => update("website", v)} placeholder="https://yourbusiness.com" />
          <Field label="Instagram" value={values.instagram} onChange={(v) => update("instagram", v)} placeholder="@yourbusiness" />
          <Field label="X / Twitter" value={values.twitter} onChange={(v) => update("twitter", v)} placeholder="@yourbusiness" />
          <Field label="TikTok" value={values.tiktok} onChange={(v) => update("tiktok", v)} placeholder="@yourbusiness" />
          <Field label="Facebook" value={values.facebook} onChange={(v) => update("facebook", v)} placeholder="facebook.com/yourbusiness" />
          <Field label="LinkedIn" value={values.linkedin} onChange={(v) => update("linkedin", v)} placeholder="linkedin.com/company/yourbusiness" />
          <PhoneField
            label="WhatsApp"
            country={waCountry}
            local={waLocal}
            onCountry={(c) => setWaFromInputs(c, waLocal)}
            onLocal={(v) => setWaFromInputs(waCountry, v)}
            placeholder="8012345678"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">Changes save automatically.</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-400">{hint}</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function PhoneField({
  label,
  country,
  local,
  onCountry,
  onLocal,
  placeholder,
}: {
  label: string;
  country: string;
  local: string;
  onCountry: (c: string) => void;
  onLocal: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1 flex rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-brand/20">
        <select
          value={country}
          onChange={(e) => onCountry(e.target.value)}
          aria-label="Country code"
          className="rounded-l-lg bg-white px-2 py-2 text-sm outline-none"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          value={local}
          onChange={(e) => onLocal(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="tel"
          placeholder={placeholder}
          className="w-full rounded-r-lg px-3 py-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: Status }) {
  if (status.kind === "saving") return <Badge color="slate">Saving…</Badge>;
  if (status.kind === "saved") return <Badge color="emerald">Saved ✓</Badge>;
  if (status.kind === "error") return <Badge color="rose">{status.msg}</Badge>;
  return null;
}

function Badge({ color, children }: { color: "slate" | "emerald" | "rose"; children: React.ReactNode }) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[color]}`}>{children}</span>;
}
