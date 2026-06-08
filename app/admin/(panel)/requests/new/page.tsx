import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAdminRequestAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function NewAdminRequestPage({ searchParams }: { searchParams: { error?: string } }) {
  const sb = supabaseAdmin();
  const { data: categories } = await sb
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New request</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create a request on behalf of a customer. It goes live immediately and matched businesses are queued — emails go out only when you check the box below or hit "Send emails" later.
          </p>
        </div>
        <Link href="/admin/requests" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to requests
        </Link>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error === "invalid"
            ? "Missing or invalid fields. Check the form and try again."
            : searchParams.error === "budget"
            ? "Budget max must be greater than or equal to budget min."
            : "Couldn't save the request."}
        </p>
      )}

      <form action={createAdminRequestAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Customer name" required />
          <Field name="email" label="Customer email" type="email" required />
          <Field name="phone" label="Customer phone" required />
          <Field name="location" label="Location" placeholder="e.g. Lekki, Lagos" required />
        </div>

        <div>
          <label className="text-sm font-medium">Industry</label>
          <select
            name="category_id"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— Select industry —</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={4}
            required
            placeholder="What do they need?"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField name="budget_min" label="Budget min (₦)" placeholder="50000" />
          <NumberField name="budget_max" label="Budget max (₦)" placeholder="100000" />
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <input type="checkbox" name="notify" defaultChecked className="mt-1 h-4 w-4 accent-brand" />
          <span>
            <strong>Send emails immediately</strong> to all matched businesses after the request is created.
            Uncheck to queue without emailing (you can send manually from the request page).
          </span>
        </label>

        <div className="flex items-center justify-end gap-2">
          <Link href="/admin/requests" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
          <SubmitButton pendingLabel="Creating…">Create request</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function NumberField({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        required
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
