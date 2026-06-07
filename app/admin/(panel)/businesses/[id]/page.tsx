import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { approveComplianceAction, rejectComplianceAction } from "../actions";

export const dynamic = "force-dynamic";

function statusPill(s: string | null) {
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-rose-50 text-rose-700",
    unsubmitted: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[s ?? "unsubmitted"]}`}>{s ?? "unsubmitted"}</span>;
}

export default async function AdminBusinessDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string } }) {
  const sb = supabaseAdmin();
  const { data: b } = await sb
    .from("businesses")
    .select("id, slug, business_name, display_name, verified, logo_url, compliance_kind, legal_name, registration_number, nin, id_document_url, registration_document_url, compliance_status, compliance_notes, compliance_submitted_at, users(email)")
    .eq("id", params.id)
    .maybeSingle();
  if (!b) notFound();

  const { count: galleryCount } = await sb
    .from("business_gallery")
    .select("*", { count: "exact", head: true })
    .eq("business_id", b.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{b.business_name || b.display_name}</h1>
          <p className="mt-1 text-sm text-slate-600">{(b as any).users?.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/b/${b.slug}`} target="_blank" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            View page ↗
          </Link>
          {statusPill(b.compliance_status)}
          {b.verified && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verified</span>}
        </div>
      </div>

      {searchParams.ok === "approved" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Approved.</p>
      )}
      {searchParams.ok === "rejected" && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">Rejected.</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Compliance details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Applying as" value={b.compliance_kind ?? "—"} />
          <Row label="Legal name" value={b.legal_name ?? "—"} />
          {b.compliance_kind === "business" ? (
            <Row label="CAC RC / BN" value={b.registration_number ?? "—"} />
          ) : (
            <Row label="NIN" value={b.nin ?? "—"} />
          )}
          <Row
            label="Submitted at"
            value={b.compliance_submitted_at ? new Date(b.compliance_submitted_at).toLocaleString() : "—"}
          />
          <Row label="Gallery images" value={String(galleryCount ?? 0)} />
          <Row label="Logo" value={b.logo_url ? "Uploaded" : "—"} />
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DocLink label="Government ID" url={b.id_document_url} />
          {b.compliance_kind === "business" && <DocLink label="CAC certificate" url={b.registration_document_url} />}
        </div>
      </section>

      {b.compliance_status === "pending" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Review</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <form action={approveComplianceAction}>
              <input type="hidden" name="id" value={b.id} />
              <button className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Approve compliance + grant verification
              </button>
            </form>
            <form action={rejectComplianceAction} className="space-y-2">
              <input type="hidden" name="id" value={b.id} />
              <input
                name="reason"
                placeholder="Note to business (optional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                Reject
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm capitalize text-slate-800">{value}</p>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
      {label} — not provided
    </div>
  );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-brand hover:text-brand"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs">Open ↗</span>
    </a>
  );
}
