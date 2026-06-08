import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatBudgetRange, formatCredits, locationsMatch } from "@/lib/leads";
import { IndustryIcon } from "@/lib/industryIcons";
import {
  addMatchAction,
  approveRequestAction,
  deleteRequestAction,
  rejectRequestAction,
  removeMatchAction,
  sendMatchedEmailsAction,
} from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import ConfirmForm from "@/components/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; n?: string; q?: string };
}) {
  const sb = supabaseAdmin();
  const { data: r } = await sb
    .from("lead_requests")
    .select("id, name, email, phone, description, status, budget_min, budget_max, location, unlock_credits, unlocks_count, unlocks_cap, is_priority, priority_paid, created_at, approved_at, reject_reason, categories(name, id)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) notFound();

  const { data: notifs } = await sb
    .from("lead_notifications")
    .select("id, business_id, email_sent, sent_at, added_by, businesses(display_name, business_name, slug, users(email))")
    .eq("request_id", r.id)
    .order("sent_at", { ascending: false });

  const matchedIds = new Set((notifs ?? []).map((n: any) => n.business_id));
  const pendingCount = (notifs ?? []).filter((n: any) => !n.email_sent).length;

  // Build searchable list of businesses to add manually
  const searchQ = (searchParams.q ?? "").trim().toLowerCase();
  let bizQuery = sb
    .from("businesses")
    .select(`
      id, business_name, display_name, slug, users(email),
      business_categories(category_id, categories(id, slug, name)),
      business_locations(location)
    `)
    .eq("setup_complete", true)
    .order("created_at", { ascending: false })
    .limit(20);
  if (searchQ) bizQuery = bizQuery.ilike("business_name", `%${searchQ}%`);
  const { data: addable } = await bizQuery;
  const requestCategoryId = (r as any).categories?.id ?? null;

  const { data: unlocks } = await sb
    .from("lead_unlocks")
    .select("created_at, credits_spent, businesses(display_name, business_name, users(email))")
    .eq("request_id", r.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request from {r.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(r.created_at).toLocaleString()}
            {r.is_priority && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  🔥 Priority{r.priority_paid ? " · paid" : " · unpaid"}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/requests/${r.id}/preview`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Preview as business ↗
          </Link>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">{r.status}</span>
          <ConfirmForm
            action={deleteRequestAction}
            hidden={[{ name: "id", value: r.id }]}
            trigger={{
              label: "Delete request",
              className: "rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50",
            }}
            title="Delete this request?"
            message="This permanently deletes the request and all its matches, unlocks and images. Can't be undone."
            confirmLabel="Delete request"
          />
        </div>
      </div>

      {searchParams.ok === "approved" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Approved · suggested matches added below.</p>
      )}
      {searchParams.ok === "rejected" && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">Request rejected.</p>
      )}
      {searchParams.ok === "added" && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Match added.</p>}
      {searchParams.ok === "removed" && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">Match removed.</p>}
      {searchParams.ok === "sent" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {searchParams.n ?? "0"} emails sent.
        </p>
      )}

      {/* Request details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Industry" value={(r as any).categories?.name ?? "—"} />
          <Row label="Budget" value={formatBudgetRange(r.budget_min, r.budget_max)} />
          <Row label="Location" value={r.location} />
          <Row label="Unlock cost" value={`${formatCredits(Number(r.unlock_credits))} credits`} />
          <Row label="Email" value={r.email} />
          <Row label="Phone" value={r.phone} />
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{r.description}</p>
        </div>
      </div>

      {/* Approve / reject controls */}
      {r.status === "submitted" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form action={approveRequestAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={r.id} />
            <h2 className="text-sm font-semibold">Approve</h2>
            <p className="mt-1 text-sm text-slate-600">Mark approved + auto-suggest matches. Emails NOT sent yet.</p>
            <SubmitButton className="mt-3" pendingLabel="Approving…">
              Approve request
            </SubmitButton>
          </form>
          <form action={rejectRequestAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="id" value={r.id} />
            <h2 className="text-sm font-semibold">Reject</h2>
            <input
              name="reason"
              placeholder="Reason (optional)"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <SubmitButton variant="danger" className="mt-3" pendingLabel="Rejecting…">
              Reject
            </SubmitButton>
          </form>
        </div>
      )}

      {/* Matches: list + add + send */}
      {r.status === "approved" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Matches ({notifs?.length ?? 0})</h2>
            {pendingCount > 0 && (
              <form action={sendMatchedEmailsAction}>
                <input type="hidden" name="request_id" value={r.id} />
                <SubmitButton pendingLabel="Sending emails…">
                  Send emails ({pendingCount} pending)
                </SubmitButton>
              </form>
            )}
          </div>

          <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <strong>Auto-match rule:</strong> business must serve <em>the same industry</em> as the request, hold at least 1 credit, and (if they've configured them) have a location overlap and a budget bracket that overlaps the request's range. Businesses with no locations or no budget ranges set are not filtered out.
          </p>

          <ul className="mt-3 divide-y divide-slate-100">
            {(notifs ?? []).map((n: any) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{n.businesses?.business_name || n.businesses?.display_name || n.businesses?.users?.email}</p>
                  <p className="text-xs text-slate-500">
                    {n.email_sent ? `Emailed ${new Date(n.sent_at).toLocaleString()}` : "Pending"}
                    {n.added_by && n.added_by !== "auto" ? ` · added by ${n.added_by}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {n.businesses?.slug && (
                    <Link href={`/b/${n.businesses.slug}`} target="_blank" className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50">
                      View ↗
                    </Link>
                  )}
                  {!n.email_sent && (
                    <ConfirmForm
                      action={removeMatchAction}
                      hidden={[
                        { name: "request_id", value: r.id },
                        { name: "business_id", value: n.business_id },
                      ]}
                      trigger={{
                        label: "Remove",
                        className: "rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50",
                      }}
                      title="Remove this match?"
                      message="They won't receive an email for this request. You can add them back manually below."
                      confirmLabel="Remove match"
                    />
                  )}
                </div>
              </li>
            ))}
            {(!notifs || notifs.length === 0) && (
              <li className="py-3 text-sm text-slate-500">No matches yet — re-approve or add manually below.</li>
            )}
          </ul>

          {/* Add by search */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold">Add a match manually</h3>
            <form className="mt-3 flex flex-wrap gap-2">
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Search by business name…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Search
              </button>
            </form>
            <ul className="mt-3 divide-y divide-slate-100">
              {(addable ?? [])
                .filter((b: any) => !matchedIds.has(b.id))
                .map((b: any) => {
                  const cats: { id: string; slug: string; name: string }[] = (b.business_categories ?? [])
                    .map((bc: any) => bc.categories)
                    .filter(Boolean);
                  const locs: string[] = (b.business_locations ?? []).map((bl: any) => bl.location).filter(Boolean);
                  return (
                    <li key={b.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.business_name || b.display_name}</p>
                        <p className="text-xs text-slate-500">{b.users?.email}</p>
                        {cats.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {cats.map((c) => {
                              const match = requestCategoryId && c.id === requestCategoryId;
                              return (
                                <li
                                  key={c.id}
                                  className={
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                                    (match ? "bg-brand/10 text-brand ring-1 ring-brand/20" : "bg-slate-100 text-slate-600")
                                  }
                                  title={match ? "Matches this request's industry" : ""}
                                >
                                  <IndustryIcon slug={c.slug} className="h-3 w-3" />
                                  {c.name}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {locs.length > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">Serves:</span>{" "}
                            {locs.map((loc, i) => {
                              const matched = locationsMatch([loc], r.location);
                              return (
                                <span key={loc + i}>
                                  {i > 0 && ", "}
                                  <span className={matched ? "font-semibold text-brand" : ""}>
                                    {matched ? "✓ " : ""}{loc}
                                  </span>
                                </span>
                              );
                            })}
                          </p>
                        )}
                      </div>
                      <form action={addMatchAction}>
                        <input type="hidden" name="request_id" value={r.id} />
                        <input type="hidden" name="business_id" value={b.id} />
                        <button className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-dark">
                          Add
                        </button>
                      </form>
                    </li>
                  );
                })}
              {(addable ?? []).filter((b: any) => !matchedIds.has(b.id)).length === 0 && (
                <li className="py-2 text-sm text-slate-500">No businesses to add. Try a different search.</li>
              )}
            </ul>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Unlocks ({r.unlocks_count} / {r.unlocks_cap})</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(unlocks ?? []).map((u: any, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span>{u.businesses?.business_name || u.businesses?.display_name || u.businesses?.users?.email}</span>
              <span className="text-xs text-slate-500">{u.credits_spent} credits · {new Date(u.created_at).toLocaleString()}</span>
            </li>
          ))}
          {(!unlocks || unlocks.length === 0) && <li className="py-2 text-sm text-slate-500">No unlocks yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
