import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MIN_NOTIFICATION_CREDITS, formatBudgetRange, formatCredits } from "@/lib/leads";
import { getOrigin } from "@/lib/originUrl";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { topup?: string; amount?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb
    .from("businesses")
    .select("id, display_name, business_name, setup_complete, verified, slug, logo_url, compliance_status")
    .eq("user_id", session.userId!)
    .maybeSingle();

  if (!business || !business.setup_complete) redirect("/business/setup");

  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId!).maybeSingle();
  const credits = Number(wallet?.credits ?? 0);

  const { data: recent } = await sb
    .from("lead_notifications")
    .select("sent_at, lead_requests(id, location, budget_min, budget_max, unlock_credits, categories(name))")
    .eq("business_id", business.id)
    .order("sent_at", { ascending: false })
    .limit(5);

  const { count: unlockCount } = await sb
    .from("lead_unlocks")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  const eligible = credits >= MIN_NOTIFICATION_CREDITS;
  const publicUrl = `${getOrigin().replace(/\/$/, "")}/b/${business.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{business.business_name || business.display_name || "Welcome"}</h1>
            {business.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" title="Verified business">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M12 2l2.6 2.4 3.5-.5.5 3.5L21 9l-1.6 3.2L21 15l-2.4 1.6.5 3.5-3.5-.5L12 22l-2.6-2.4-3.5.5-.5-3.5L3 15l1.6-3-1.6-3 2.4-1.6-.5-3.5 3.5.5L12 2zM9.5 14.2l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1-1.4 1.4 3.5 3.5z" />
                </svg>
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">Your dashboard at a glance.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-300">
                {(business.business_name || "F").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your public page</p>
            <p className="truncate text-sm font-medium text-slate-800">{publicUrl}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/b/${business.slug}`} target="_blank" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
            View page ↗
          </Link>
          <Link href="/business/profile" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Edit
          </Link>
        </div>
      </div>

      {searchParams.topup === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 Top-up successful{searchParams.amount ? ` — ₦${Number(searchParams.amount).toLocaleString()} credited.` : "."}{" "}
          Your balance is now <strong>{formatCredits(credits)} credits</strong>.
        </div>
      )}

      <ComplianceCard status={business.compliance_status ?? "unsubmitted"} verified={!!business.verified} />

      {!eligible && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You need at least <strong>{MIN_NOTIFICATION_CREDITS} credits</strong> to start receiving lead notifications.{" "}
          <Link href="/business/wallet" className="font-semibold underline">Top up your wallet →</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Wallet" value={`${formatCredits(credits)}`} hint="credits" />
        <Stat label="Leads unlocked" value={String(unlockCount ?? 0)} hint="total" />
        <Stat label="Status" value={business.verified ? "Verified" : "Unverified"} hint="business" />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent leads matched to you</h2>
          <Link href="/business/leads" className="text-sm font-medium text-brand">View all →</Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {(recent ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              No leads yet. Once you have {MIN_NOTIFICATION_CREDITS}+ credits, matching requests will land here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(recent ?? []).map((row: any) => (
                <li key={row.lead_requests?.id ?? row.sent_at} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.lead_requests?.categories?.name ?? "Lead"} · {row.lead_requests?.location}</p>
                    <p className="text-xs text-slate-500">{formatBudgetRange(row.lead_requests?.budget_min ?? 0, row.lead_requests?.budget_max ?? 0)}</p>
                  </div>
                  <Link href={`/business/leads/${row.lead_requests?.id}`} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function ComplianceCard({ status, verified }: { status: string; verified: boolean }) {
  if (verified) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M12 2l2.6 2.4 3.5-.5.5 3.5L21 9l-1.6 3.2L21 15l-2.4 1.6.5 3.5-3.5-.5L12 22l-2.6-2.4-3.5.5-.5-3.5L3 15l1.6-3-1.6-3 2.4-1.6-.5-3.5 3.5.5L12 2zM9.5 14.2l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1-1.4 1.4 3.5 3.5z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">You're verified</p>
            <p className="text-xs text-emerald-700/80">Verified businesses get priority matches and the trust badge on your public page.</p>
          </div>
        </div>
        <Link href="/business/compliance" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">View details →</Link>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Compliance is under review</p>
            <p className="text-xs text-amber-800/80">We'll email you the moment it's approved. You can still receive leads in the meantime.</p>
          </div>
        </div>
        <Link href="/business/compliance" className="text-sm font-medium text-amber-800 hover:text-amber-900">Check status →</Link>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">!</span>
          <div>
            <p className="text-sm font-semibold text-rose-800">Compliance was rejected</p>
            <p className="text-xs text-rose-700/80">Check the reviewer note and re-submit to keep growing on Folio.</p>
          </div>
        </div>
        <Link href="/business/compliance" className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">Fix and resubmit</Link>
      </div>
    );
  }
  // unsubmitted
  return (
    <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-fuchsia-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-md">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M12 2l2.6 2.4 3.5-.5.5 3.5L21 9l-1.6 3.2L21 15l-2.4 1.6.5 3.5-3.5-.5L12 22l-2.6-2.4-3.5.5-.5-3.5L3 15l1.6-3-1.6-3 2.4-1.6-.5-3.5 3.5.5L12 2z" />
            </svg>
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight">Get the Verified badge</p>
            <p className="mt-1 text-sm text-slate-600">
              Submit your standard Nigerian compliance docs (CAC RC/BN or NIN + government ID) to win client trust faster and unlock priority matches.
            </p>
          </div>
        </div>
        <Link
          href="/business/compliance"
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Start compliance →
        </Link>
      </div>
    </div>
  );
}
