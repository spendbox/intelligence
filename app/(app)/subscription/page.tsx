import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function SubscriptionPage() {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("email, status, trial_ends_at")
    .eq("id", session.userId!)
    .single();

  const trialing = user?.status === "trialing";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your plan and billing.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current plan</p>
        <p className="mt-1 text-lg font-semibold capitalize">{user?.status}</p>
        {trialing && user?.trial_ends_at && (
          <p className="mt-1 text-sm text-slate-600">
            Free trial ends on {new Date(user.trial_ends_at).toLocaleDateString()}.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
        <h2 className="text-base font-semibold">Yearly subscription</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paid plans powered by Paystack are coming soon. You'll be able to upgrade right here without
          leaving the app.
        </p>
        <button
          disabled
          className="mt-4 cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-500"
        >
          Subscribe — coming soon
        </button>
      </div>
    </div>
  );
}
