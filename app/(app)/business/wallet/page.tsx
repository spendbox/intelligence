import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { startTopupAction } from "./actions";
import { nairaToCredits, TOPUP_MIN_NAIRA, TOPUP_MAX_NAIRA, formatNaira, MIN_NOTIFICATION_CREDITS } from "@/lib/leads";

export const dynamic = "force-dynamic";

const QUICK = [1000, 5000, 10000, 50000, 100000, 500000];

export default async function WalletPage({ searchParams }: { searchParams: { status?: string; amount?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: wallet } = await sb.from("wallets").select("credits, total_topup_naira").eq("user_id", session.userId!).maybeSingle();
  const credits = wallet?.credits ?? 0;

  const { data: tx } = await sb
    .from("wallet_transactions")
    .select("id, delta, reason, naira_amount, reference, created_at")
    .eq("user_id", session.userId!)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-slate-600">Top up to unlock leads. Every ₦10 = 1 credit.</p>
      </div>

      {searchParams.status === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Top-up successful — your credits have been added.
        </p>
      )}
      {searchParams.status === "failed" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">Top-up didn't complete. No money was charged.</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/10 to-fuchsia-50 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Balance</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-brand">{credits.toLocaleString()}</p>
        <p className="text-xs text-slate-600">credits · worth ~{formatNaira(credits * 10)}</p>
        {credits < MIN_NOTIFICATION_CREDITS && (
          <p className="mt-2 text-xs text-amber-700">
            You need at least {MIN_NOTIFICATION_CREDITS} credits to receive lead notifications.
          </p>
        )}
      </div>

      <form action={startTopupAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Top up</h2>
        <p className="text-xs text-slate-500">Minimum {formatNaira(TOPUP_MIN_NAIRA)} · maximum {formatNaira(TOPUP_MAX_NAIRA)}.</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((amt) => (
            <button
              key={amt}
              type="submit"
              name="amount"
              value={amt}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {formatNaira(amt)} · +{nairaToCredits(amt).toLocaleString()} credits
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            name="amount"
            min={TOPUP_MIN_NAIRA}
            max={TOPUP_MAX_NAIRA}
            placeholder="Custom amount (₦)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Top up
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(tx ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium capitalize">{t.reason}</p>
                <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <p className={"text-sm font-semibold " + (t.delta >= 0 ? "text-emerald-700" : "text-rose-700")}>
                {t.delta >= 0 ? "+" : ""}{t.delta.toLocaleString()} credits
              </p>
            </li>
          ))}
          {(!tx || tx.length === 0) && <li className="py-3 text-slate-500">No transactions yet.</li>}
        </ul>
      </section>
    </div>
  );
}
