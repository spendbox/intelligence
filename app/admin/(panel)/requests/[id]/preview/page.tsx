import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange, formatCredits } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Renders the lead-request page exactly as a notified business would see it
// (no unlock action — this is admin-only QA preview).
export default async function AdminBusinessPreview({ params }: { params: { id: string } }) {
  const sb = supabaseAdmin();
  const { data: r } = await sb
    .from("lead_requests")
    .select("id, name, email, phone, description, status, budget_min, budget_max, location, unlock_credits, unlocks_count, unlocks_cap, created_at, categories(name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) notFound();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-ink px-4 py-2 text-xs text-white">
          <span className="font-medium text-white/80">Admin preview · how this looks to a business</span>
          <Link href={`/admin/requests/${r.id}`} className="font-semibold text-white">← Back to admin</Link>
        </div>

        <Link href="#" className="text-sm text-slate-500">← Back to leads</Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{(r as any).categories?.name ?? "Lead"}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{r.location}</h1>
              <p className="mt-1 text-sm text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)} · posted {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {formatCredits(Number(r.unlock_credits))} credits
            </span>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Brief</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{r.description}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Client name</p>
              <p className="mt-0.5 select-none text-sm text-slate-300 blur-[3px]">{r.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-0.5 select-none text-sm text-slate-300 blur-[3px]">{r.phone}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-0.5 select-none text-sm text-slate-300 blur-[3px]">{r.email}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Unlock client contact</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {r.unlocks_count}/{r.unlocks_cap} businesses have unlocked.
                </p>
              </div>
              <button disabled className="cursor-not-allowed rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white opacity-60">
                Unlock for {formatCredits(Number(r.unlock_credits))} credits
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Preview only — unlock disabled in admin view.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
