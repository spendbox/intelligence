import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange } from "@/lib/leads";
import { unlockLeadAction } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function BusinessLeadDetail({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb.from("businesses").select("id, setup_complete").eq("user_id", session.userId!).maybeSingle();
  if (!business || !business.setup_complete) redirect("/business/setup");

  const { data: r } = await sb
    .from("lead_requests")
    .select("id, name, email, phone, description, status, budget_min, budget_max, location, unlock_credits, unlocks_count, unlocks_cap, created_at, categories(name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) notFound();

  if (r.status !== "approved") notFound();

  const { data: unlock } = await sb
    .from("lead_unlocks")
    .select("created_at, credits_spent")
    .eq("request_id", r.id)
    .eq("business_id", business.id)
    .maybeSingle();
  const isUnlocked = !!unlock;

  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId!).maybeSingle();
  const credits = wallet?.credits ?? 0;
  const capReached = r.unlocks_count >= r.unlocks_cap;
  const canAfford = credits >= r.unlock_credits;

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/business/leads" className="text-sm text-slate-500 hover:text-slate-700">← Back to leads</Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{(r as any).categories?.name ?? "Lead"}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{r.location}</h1>
            <p className="mt-1 text-sm text-slate-600">{formatBudgetRange(r.budget_min, r.budget_max)} · posted {new Date(r.created_at).toLocaleDateString()}</p>
          </div>
          {isUnlocked ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Unlocked</span>
          ) : capReached ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Cap reached</span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {r.unlock_credits} credits
            </span>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Brief</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{r.description}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Locked label="Client name" value={r.name} unlocked={isUnlocked} />
          <Locked label="Phone" value={r.phone} unlocked={isUnlocked} />
          <Locked label="Email" value={r.email} unlocked={isUnlocked} />
        </div>

        {!isUnlocked && (
          <form action={unlockLeadAction} className="mt-6 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <input type="hidden" name="id" value={r.id} />
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Unlock client contact</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {r.unlocks_count}/{r.unlocks_cap} businesses have unlocked. Your balance: <strong>{credits.toLocaleString()} credits</strong>.
                </p>
              </div>
              <SubmitButton
                disabled={capReached || !canAfford}
                pendingLabel="Unlocking…"
              >
                {capReached ? "Cap reached" : canAfford ? `Unlock for ${r.unlock_credits} credits` : `Top up — need ${r.unlock_credits - credits} more`}
              </SubmitButton>
            </div>
            {!canAfford && !capReached && (
              <Link href="/business/wallet" className="mt-2 inline-block text-xs font-medium text-brand">Go to wallet →</Link>
            )}
            {searchParams.error && <p className="mt-2 text-xs text-rose-600">{searchParams.error === "cap" ? "Already at the unlock cap." : searchParams.error === "credits" ? "Not enough credits." : "Something went wrong."}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

function Locked({ label, value, unlocked }: { label: string; value: string; unlocked: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={"mt-0.5 text-sm " + (unlocked ? "text-slate-800" : "select-none text-slate-300 blur-[3px]")}>
        {unlocked ? value : "•••••• locked"}
      </p>
    </div>
  );
}
