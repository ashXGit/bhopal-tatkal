import { NextResponse, type NextRequest } from "next/server";
import { canAccess } from "@/lib/auth/roles";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  if (canAccess(pathname, session?.role ?? null)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: session ? "Forbidden" : "Unauthorised" }, { status: session ? 403 : 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/authority/:path*", "/admin/:path*", "/my-issues/:path*", "/messages/:path*", "/api/authority/:path*", "/api/admin/:path*"],
};
