import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type UserSession = { userId?: string };
export type AdminSession = { email?: string };

function userOpts(): SessionOptions {
  return {
    cookieName: "intel_user_session",
    password: env.sessionSecret(),
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

function adminOpts(): SessionOptions {
  return {
    cookieName: "intel_admin_session",
    password: env.sessionSecret(),
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getUserSession() {
  return getIronSession<UserSession>(cookies(), userOpts());
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(cookies(), adminOpts());
}
