import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedPaths = [
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

// Routes that should redirect to dashboard if already authenticated
const authPaths = ["/login", "/signup", "/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("session_token")?.value;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = authPaths.some((p) => pathname === p);

  // In development mode, allow access without a session cookie
  if (process.env.NODE_ENV === "development") {
    // If on auth page with a session, redirect to dashboard
    if (isAuthPage && sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Production: redirect unauthenticated users to login
  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
