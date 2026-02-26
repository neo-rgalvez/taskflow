import { NextRequest, NextResponse } from "next/server";

// Protected route prefixes — any path starting with these requires auth
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/today",
  "/clients",
  "/projects",
  "/tasks",
  "/time",
  "/invoices",
  "/calendar",
  "/analytics",
  "/settings",
];

// Auth pages — redirect to dashboard if already logged in
const AUTH_PAGES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_token")?.value;
  const hasSession = !!sessionCookie && sessionCookie.includes(".");

  // Protected routes: redirect to login if no session cookie
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pages: redirect to dashboard if already has session
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page);

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (handled by their own auth)
     * - _next (static files)
     * - favicon, images, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
