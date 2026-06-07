import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MIN_NOTIFICATION_CREDITS, formatBudgetRange } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getUserSession();
  const sb = supabaseAdmin();

  const { data: business } = await sb
    .from("businesses")
    .select("id, display_name, business_name, setup_complete, verified")
    .eq("user_id", session.userId!)
    .maybeSingle();

  if (!business || !business.setup_complete) redirect("/business/setup");

  const { data: wallet } = await sb.from("wallets").select("credits").eq("user_id", session.userId!).maybeSingle();
  const credits = wallet?.credits ?? 0;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{business.business_name || business.display_name || "Welcome"}</h1>
        <p className="mt-1 text-sm text-slate-600">Your dashboard at a glance.</p>
      </div>

      {!eligible && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You need at least <strong>{MIN_NOTIFICATION_CREDITS} credits</strong> to start receiving lead notifications.{" "}
          <Link href="/business/wallet" className="font-semibold underline">Top up your wallet →</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Wallet" value={`${credits.toLocaleString()}`} hint="credits" />
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
