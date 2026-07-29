import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { OAUTH_STATE_COOKIE } from "@/lib/auth/constants";
import { googleRedirectUri } from "@/lib/auth/google";

/** Step 1 of Google sign-in: send the user to Google's consent screen. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", req.url),
    );
  }

  // `state` is a random nonce echoed back by Google and compared against the
  // cookie, which is what stops a CSRF-style forged callback.
  const nonce = randomBytes(16).toString("base64url");
  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", googleRedirectUri(req));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", nonce);
  // Keeps the account chooser predictable rather than silently reusing a login.
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, `${nonce}:${next}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // the round-trip should take seconds, not hours
  });
  return res;
}
