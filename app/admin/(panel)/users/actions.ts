"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { applyTopup } from "@/lib/wallet";

export async function manualCreditAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session.email) redirect("/admin/login");

  const userId = String(formData.get("user_id") ?? "");
  const naira = parseInt(String(formData.get("naira") ?? "0"), 10);
  const note = String(formData.get("note") ?? "").trim().slice(0, 120) || "admin_credit";
  if (!userId || !Number.isFinite(naira) || naira <= 0) redirect("/admin/users?error=1");

  const reference = `admin_${Date.now()}_${userId.slice(0, 8)}`;
  const out = await applyTopup({ userId, naira, reference, source: "admin" });
  if (!out.ok) redirect(`/admin/users?error=1`);
  redirect(`/admin/users?credited=${out.credited}&note=${encodeURIComponent(note)}`);
}
