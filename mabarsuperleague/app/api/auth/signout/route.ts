import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Clears the session cookie, then redirects to the login page.
 *
 * A page rendering on the server cannot delete a cookie, so the DAL sends users
 * here when their token turns out to be invalid or expired. Without this, a stale
 * cookie would loop forever: Proxy sees a cookie and keeps the user away from
 * /login, while the page keeps rejecting them for having no valid session.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await fetch(`${API_BASE_SERVER}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }

  const raw = req.nextUrl.searchParams.get("next");
  const url = new URL(LOGIN_PATH, req.url);
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    url.searchParams.set("next", raw);
  }
  if (req.nextUrl.searchParams.get("expired")) {
    url.searchParams.set("error", "session_expired");
  }

  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
