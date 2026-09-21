import { NextResponse, type NextRequest } from "next/server";

import { googleRedirectUri } from "@/lib/auth/google";
import { beginSignIn } from "@/lib/auth/oauth";

/** Step 1 of Google sign-in: send the user to Google's consent screen. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", req.url),
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", googleRedirectUri(req));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  // Keeps the account chooser predictable rather than silently reusing a login.
  authUrl.searchParams.set("prompt", "select_account");

  return beginSignIn(req, "google", authUrl);
}
