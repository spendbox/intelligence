import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import TopUpForm from "./TopUpForm";
import { formatNaira, formatCredits, MIN_NOTIFICATION_CREDITS, TOPUP_MAX_NAIRA, TOPUP_MIN_NAIRA } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function WalletPage({ searchParams }: { searchParams: { status?: string; reason?: string } }) {
  const session = await getUserSession();
  if (!session.userId) redirect("/login");
  const sb = supabaseAdmin();
  const settings = await getSettings();
  const npc = settings.naira_per_credit || 10;

  const { data: wallet } = await sb.from("wallets").select("credits, total_topup_naira").eq("user_id", session.userId).maybeSingle();
  const credits = Number(wallet?.credits ?? 0);

  const { data: tx } = await sb
    .from("wallet_transactions")
    .select("id, delta, reason, naira_amount, reference, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-slate-600">Top up to unlock leads. Every ₦{npc} = 1 credit.</p>
      </div>

      {searchParams.status === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Top-up successful — your credits have been added.
        </p>
      )}
      {searchParams.status === "failed" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Top-up didn't complete. No money was charged{searchParams.reason ? ` (${searchParams.reason})` : ""}.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/10 to-fuchsia-50 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Balance</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-brand">{formatCredits(credits)}</p>
        <p className="text-xs text-slate-600">credits · worth ~{formatNaira(credits * npc)}</p>
        {credits < MIN_NOTIFICATION_CREDITS && (
          <p className="mt-2 text-xs text-amber-700">
            You need at least {MIN_NOTIFICATION_CREDITS} credit to receive lead notifications.
          </p>
        )}
      </div>

      <TopUpForm nairaPerCredit={npc} minNaira={TOPUP_MIN_NAIRA} maxNaira={TOPUP_MAX_NAIRA} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(tx ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium capitalize">{t.reason}</p>
                <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <p className={"text-sm font-semibold " + (Number(t.delta) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                {Number(t.delta) >= 0 ? "+" : ""}{formatCredits(Number(t.delta))} credits
              </p>
            </li>
          ))}
          {(!tx || tx.length === 0) && <li className="py-3 text-slate-500">No transactions yet.</li>}
        </ul>
      </section>
    </div>
  );
}
