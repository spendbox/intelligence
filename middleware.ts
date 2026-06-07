import { NextResponse, type NextRequest } from "next/server";

// Cookie names must match lib/auth/session.ts
const USER_COOKIE = "intel_user_session";
const ADMIN_COOKIE = "intel_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin panel — requires admin cookie, but allow /admin/login itself
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get(ADMIN_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // User app routes
  const userProtected = ["/dashboard", "/categories", "/subscription", "/account", "/business"];
  if (userProtected.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!req.cookies.get(USER_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/categories/:path*",
    "/subscription/:path*",
    "/account/:path*",
    "/business/:path*",
  ],
};
