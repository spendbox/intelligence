import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { startCheckoutAction } from "./actions";

export const dynamic = "force-dynamic";

function formatMoney(kobo: number, currency: string) {
  const amount = (kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const symbol = currency === "NGN" ? "₦" : currency + " ";
  return `${symbol}${amount}`;
}

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { status?: string; ref?: string };
}) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("email, status, trial_ends_at, subscription_ends_at, subscription_plan")
    .eq("id", session.userId!)
    .single();

  const settings = await getSettings();
  const trialing = user?.status === "trialing";
  const subActive = user?.subscription_ends_at && new Date(user.subscription_ends_at) > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your plan</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your subscription and billing.</p>
      </div>

      {searchParams.status === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Payment successful — your subscription is active.
        </p>
      )}
      {searchParams.status === "failed" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Payment was not completed. Try again whenever you're ready.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current status</p>
        <p className="mt-1 text-lg font-semibold capitalize">{user?.status}</p>
        {trialing && user?.trial_ends_at && (
          <p className="mt-1 text-sm text-slate-600">
            Free trial ends on {new Date(user.trial_ends_at).toLocaleDateString()}.
          </p>
        )}
        {subActive && (
          <p className="mt-1 text-sm text-slate-600">
            {user?.subscription_plan === "yearly" ? "Yearly" : "Monthly"} plan, renews{" "}
            {new Date(user!.subscription_ends_at!).toLocaleDateString()}.
          </p>
        )}
      </div>

      {settings.paystack_enabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={startCheckoutAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="plan" value="monthly" />
            <h2 className="text-base font-semibold">Monthly</h2>
            <p className="text-3xl font-bold">{formatMoney(settings.price_monthly_kobo, settings.currency)}</p>
            <p className="text-sm text-slate-600">Billed every month.</p>
            <button className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
              Subscribe monthly
            </button>
          </form>

          <form action={startCheckoutAction} className="space-y-3 rounded-xl border border-brand bg-white p-5 shadow-sm">
            <input type="hidden" name="plan" value="yearly" />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Yearly</h2>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Best value</span>
            </div>
            <p className="text-3xl font-bold">{formatMoney(settings.price_yearly_kobo, settings.currency)}</p>
            <p className="text-sm text-slate-600">Billed once a year.</p>
            <button className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">
              Subscribe yearly
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
          <h2 className="text-base font-semibold">Paid plans</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paid subscriptions are coming soon. Enjoy your free trial in the meantime.
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-500"
          >
            Subscribe — coming soon
          </button>
        </div>
      )}
    </div>
  );
}
