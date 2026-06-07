import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveProfileAction } from "./actions";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: { saved?: string } }) {
  const session = await getUserSession();
  const sb = supabaseAdmin();
  const { data: business } = await sb
    .from("businesses")
    .select("id, business_name, display_name, slug, bio, phone, cac_number, verified")
    .eq("user_id", session.userId!)
    .maybeSingle();
  if (!business) redirect("/business/setup");

  const publicUrl = `${env.appUrl()}/b/${business.slug}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your public page</h1>
        <p className="mt-1 text-sm text-slate-600">
          Share this with clients. <Link href={`/b/${business.slug}`} className="font-medium text-brand">View page →</Link>
        </p>
      </div>

      {searchParams.saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Profile saved.</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Public URL</p>
        <p className="mt-1 break-all font-mono text-sm text-slate-800">{publicUrl}</p>
      </div>

      <form action={saveProfileAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Business name</label>
            <input name="business_name" defaultValue={business.business_name ?? ""} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Display name</label>
            <input name="display_name" defaultValue={business.display_name ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input name="phone" defaultValue={business.phone ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">CAC number <span className="text-xs text-slate-400">Optional</span></label>
            <input name="cac_number" defaultValue={business.cac_number ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">About</label>
          <textarea name="bio" rows={4} defaultValue={business.bio ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Save</button>
      </form>

      <Link href="/business/setup" className="inline-block text-sm font-medium text-brand">Edit industries, locations and budget ranges →</Link>
    </div>
  );
}
