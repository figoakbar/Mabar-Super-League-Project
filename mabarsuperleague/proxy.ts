import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/constants";

// Next.js 16 renamed Middleware to Proxy; the behaviour is unchanged.
//
// This is an *optimistic* gate: it only checks that a session cookie exists, so
// signed-out visitors are bounced before a page renders. It deliberately does no
// API or database work. The authoritative check — including "is this user an
// admin?" — lives in the admin layout via lib/auth/dal.ts, close to the data, as
// the Next.js authentication guide recommends.

/** Auth screens: reachable without a session, and a signed-in visitor is sent
 *  home instead. reset-password is here: the user is locked out. */
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/** Open to everyone, signed in or not — the guide a prospective player reads
 *  before they have an account, and the target of "Need help?". */
const openRoutes = ["/how-to-play"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoggedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublicRoute = authRoutes.includes(pathname);

  // Open to all — never redirected in either direction.
  if (openRoutes.includes(pathname)) return NextResponse.next();

  // Guest visiting a protected page → send to login, remembering the target.
  if (!isLoggedIn && !isPublicRoute) {
    const url = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Already logged in but visiting login/register → send to the dashboard.
  // reset-password stays reachable so a signed-in user can still change theirs.
  if (isLoggedIn && isPublicRoute && pathname !== "/reset-password") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // `api` is excluded on purpose: those route handlers authenticate themselves,
  // and redirecting them would break the Google OAuth callback and the /api/msl
  // gateway that signed-out visitors use to read public data.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
  ],
};
