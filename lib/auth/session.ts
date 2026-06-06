import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export type UserSession = { userId?: string };
export type AdminSession = { email?: string };
export type PinSetupSession = { email?: string; userId?: string; verifiedAt?: number };

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

function pinSetupOpts(): SessionOptions {
  return {
    cookieName: "intel_pin_setup",
    password: env.sessionSecret(),
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    },
  };
}

export async function getPinSetupSession() {
  return getIronSession<PinSetupSession>(cookies(), pinSetupOpts());
}

export const PIN_SETUP_MAX_AGE_MS = 10 * 60 * 1000;
