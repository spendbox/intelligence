import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { approveBusinessAction, revokeBusinessAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage({ searchParams }: { searchParams: { filter?: string; ok?: string } }) {
  const sb = supabaseAdmin();
  const filter = (searchParams.filter ?? "pending") as string;

  let q = sb
    .from("businesses")
    .select("id, slug, business_name, display_name, verified, setup_complete, logo_url, created_at, users(email), business_categories(category_id)")
    .eq("setup_complete", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "pending") q = q.eq("verified", false);
  if (filter === "verified") q = q.eq("verified", true);

  const { data: businesses } = await q;

  const { count: pendingCount } = await sb
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("setup_complete", true)
    .eq("verified", false);
  const { count: verifiedCount } = await sb
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("verified", true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="mt-1 text-sm text-slate-600">
          {pendingCount ?? 0} pending review · {verifiedCount ?? 0} verified
        </p>
      </div>

      {searchParams.ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Done.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { k: "pending", label: "Pending" },
          { k: "verified", label: "Verified" },
          { k: "all", label: "All" },
        ].map((t) => (
          <Link
            key={t.k}
            href={`/admin/businesses?filter=${t.k}`}
            className={
              "rounded-full px-3 py-1 text-xs font-medium " +
              (filter === t.k ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Business</th>
              <th className="px-4 py-2.5">Owner</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(businesses ?? []).map((b: any) => (
              <tr key={b.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {b.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-300">
                          {(b.business_name || "F").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{b.business_name || b.display_name}</p>
                      {b.display_name && b.display_name !== b.business_name && (
                        <p className="text-xs text-slate-500">{b.display_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{b.users?.email}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{b.slug}</td>
                <td className="px-4 py-2.5">
                  {b.verified ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(b.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/b/${b.slug}`}
                      target="_blank"
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View page ↗
                    </Link>
                    {b.verified ? (
                      <form action={revokeBusinessAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50">
                          Revoke
                        </button>
                      </form>
                    ) : (
                      <form action={approveBusinessAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-dark">
                          Approve
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!businesses || businesses.length === 0) && (
              <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>No businesses in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
