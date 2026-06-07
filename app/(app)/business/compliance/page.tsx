import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import ComplianceForm from "./ComplianceForm";

export const dynamic = "force-dynamic";

export default async function CompliancePage({ searchParams }: { searchParams: { saved?: string; submitted?: string; error?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: b } = await sb
    .from("businesses")
    .select("id, business_name, display_name, slug, verified, logo_url, compliance_kind, legal_name, registration_number, nin, id_document_url, registration_document_url, compliance_status, compliance_notes")
    .eq("user_id", session.userId!)
    .maybeSingle();
  if (!b) redirect("/business/setup");

  const { count: galleryCount } = await sb
    .from("business_gallery")
    .select("*", { count: "exact", head: true })
    .eq("business_id", b.id);
  const hasGalleryImage = (galleryCount ?? 0) >= 1;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Get verified by submitting your standard Nigerian compliance documents. Verified businesses get the badge, priority lead matching, and other benefits we're rolling out.
        </p>
      </div>

      {searchParams.submitted && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Submitted for review. You'll get an email once we approve it.
        </p>
      )}
      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved.</p>
      )}
      {searchParams.error === "upload" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Couldn't upload that file. Make sure it's a PDF or image under 5MB.</p>
      )}
      {searchParams.error === "incomplete" && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Fill in the required items before submitting.</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
        <p className="mt-1 text-lg font-semibold capitalize">
          {b.verified ? "Verified" : b.compliance_status === "pending" ? "Pending review" : b.compliance_status === "rejected" ? "Rejected" : "Unsubmitted"}
        </p>
        {b.compliance_status === "rejected" && b.compliance_notes && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Reviewer note: {b.compliance_notes}
          </p>
        )}
        {b.compliance_status === "approved" && (
          <p className="mt-2 text-sm text-emerald-700">You're approved. Upgrade later by re-submitting if you change entity type.</p>
        )}
      </div>

      <ComplianceForm
        initial={{
          kind: (b.compliance_kind ?? "business") as "business" | "individual",
          legal_name: b.legal_name ?? "",
          registration_number: b.registration_number ?? "",
          nin: b.nin ?? "",
        }}
        idDocumentUrl={b.id_document_url}
        registrationDocumentUrl={b.registration_document_url}
        hasGalleryImage={hasGalleryImage}
        hasLogo={!!b.logo_url}
        status={b.compliance_status as any}
      />

      <p className="text-xs text-slate-500">
        Tip: at least one gallery image is required.{" "}
        <Link href="/business/profile" className="font-medium text-brand">Add one in your profile →</Link>
      </p>
    </div>
  );
}
