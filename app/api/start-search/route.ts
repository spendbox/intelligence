import { NextResponse, type NextRequest } from "next/server";

// The landing-page search bar posts here. We stash the natural-language
// query in a cookie and bounce visitors to login. After they sign in (or
// finish setup), /business/discover reads the cookie and pre-fills the
// search box with their query so the scan they typed actually happens.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 240);
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const res = NextResponse.redirect(url);
  if (q) {
    res.cookies.set("pending_search", q, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 30, // 30 min
      path: "/",
    });
  }
  return res;
}
