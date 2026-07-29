import "server-only";

import type { NextRequest } from "next/server";

/**
 * The redirect URI must match a value registered in the Google Cloud console
 * exactly. Set GOOGLE_REDIRECT_URI in production; in development it is derived
 * from the incoming request so a changed port still works.
 */
export function googleRedirectUri(req: NextRequest): string {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (configured) return configured;
  return new URL("/api/auth/google/callback", req.nextUrl.origin).toString();
}

type TokenResponse = { id_token?: string; error_description?: string };

/** Google's verified profile claims, taken from the ID token. */
export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

/**
 * Exchange the one-time authorization code for an ID token.
 *
 * The exchange happens server-to-server with the client secret, and Google only
 * hands the token to a caller that knows that secret — which is why the ID token
 * can be trusted after checking its `aud`, `iss` and expiry below.
 */
export async function exchangeCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google is not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const body = (await res.json()) as TokenResponse;
  if (!res.ok || !body.id_token) {
    throw new Error(body.error_description ?? "Google token exchange failed");
  }
  return verifyIdToken(body.id_token, clientId);
}

type IdTokenClaims = {
  iss?: string;
  aud?: string;
  sub?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

function decodeSegment(segment: string): IdTokenClaims {
  return JSON.parse(
    Buffer.from(segment, "base64url").toString("utf8"),
  ) as IdTokenClaims;
}

/**
 * Validate the claims that matter for our use. The signature is not re-checked
 * because the token came directly from Google's token endpoint over TLS in
 * response to our authenticated request — Google documents this as sufficient.
 */
function verifyIdToken(idToken: string, clientId: string): GoogleProfile {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed Google ID token");
  const claims = decodeSegment(parts[1]);

  const issuerOk =
    claims.iss === "https://accounts.google.com" ||
    claims.iss === "accounts.google.com";
  if (!issuerOk) throw new Error("Unexpected Google token issuer");
  if (claims.aud !== clientId) throw new Error("Google token audience mismatch");
  if (!claims.exp || claims.exp * 1000 < Date.now()) {
    throw new Error("Google token has expired");
  }
  if (!claims.sub || !claims.email) {
    throw new Error("Google token is missing an email");
  }

  const verified =
    claims.email_verified === true || claims.email_verified === "true";
  if (!verified) {
    // An unverified address could belong to someone else.
    throw new Error("Your Google email address is not verified");
  }

  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified: verified,
    name: claims.name,
    picture: claims.picture,
  };
}
