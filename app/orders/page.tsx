import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LogoMark } from "@/lib/logo";
import { formatBudgetRange } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const email = cookies().get("folio_order_email")?.value ?? null;

  if (!email) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-5 py-12 text-slate-800">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <LogoMark className="h-5 w-5" />
            Folio
          </Link>
          <h1 className="mt-8 text-2xl font-bold">Your requests</h1>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            We don't have any requests linked to this device yet. Post a new request and we'll remember your email for next time.
            <div className="mt-4">
              <Link href="/order" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Post a request →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const sb = supabaseAdmin();
  const { data: rows } = await sb
    .from("lead_requests")
    .select("id, name, description, status, budget_min, budget_max, location, is_priority, priority_paid, created_at, categories(name)")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-5 py-12 text-slate-800">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
          <LogoMark className="h-5 w-5" />
          Folio
        </Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Your requests</h1>
            <p className="mt-1 text-sm text-slate-600">Linked to {email}</p>
          </div>
          <Link href="/order" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
            + New request
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {(rows ?? []).length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No requests yet.
            </div>
          )}
          {(rows ?? []).map((r: any) => (
            <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">{r.categories?.name ?? "Request"}</p>
                  <p className="mt-1 text-base font-semibold">{r.location}</p>
                  <p className="text-sm text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {r.is_priority && r.priority_paid && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      🔥 Priority
                    </span>
                  )}
                  <StatusPill status={r.status} />
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-700">{r.description}</p>
              <p className="mt-2 text-xs text-slate-400">Posted {new Date(r.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-rose-50 text-rose-700",
    closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
