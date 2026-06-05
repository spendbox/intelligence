"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { getAdminSession } from "@/lib/auth/session";

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function adminLoginAction(formData: FormData) {
  const parsed = Schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) redirect("/admin/login?error=1");

  const expectedEmail = env.adminEmail().toLowerCase();
  if (parsed.data.email !== expectedEmail) redirect("/admin/login?error=1");

  const ok = await bcrypt.compare(parsed.data.password, env.adminPasswordHash());
  if (!ok) redirect("/admin/login?error=1");

  const session = await getAdminSession();
  session.email = expectedEmail;
  await session.save();

  redirect("/admin/insights");
}

export async function adminLogoutAction() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
