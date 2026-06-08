"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { getAdminSession } from "@/lib/auth/session";

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) });

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function adminLoginAction(formData: FormData) {
  const parsed = Schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) redirect("/admin/login?error=1");

  const expectedEmail = env.adminEmail().toLowerCase();
  const expectedPassword = env.adminPassword();

  const emailOk = safeEqual(parsed.data.email, expectedEmail);
  const passwordOk = safeEqual(parsed.data.password, expectedPassword);
  if (!emailOk || !passwordOk) redirect("/admin/login?error=1");

  const session = await getAdminSession();
  session.email = expectedEmail;
  await session.save();

  redirect("/admin/requests");
}

export async function adminLogoutAction() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
