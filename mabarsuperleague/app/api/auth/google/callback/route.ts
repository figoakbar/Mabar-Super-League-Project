import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { OAUTH_STATE_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants";
import { exchangeCodeForProfile, googleRedirectUri } from "@/lib/auth/google";

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function fail(req: NextRequest, reason: string) {
  const res = NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(reason)}`, req.url),
  );
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}

/** Step 2 of Google sign-in: verify the callback and mint our own session. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // The user pressed "cancel" on Google's screen.
  if (params.get("error")) return fail(req, "google_cancelled");

  const code = params.get("code");
  const state = params.get("state");
  const stored = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !stored) return fail(req, "google_state_missing");

  const [nonce, next = "/"] = stored.split(":");
  if (!sameString(state, nonce)) return fail(req, "google_state_mismatch");

  try {
    const profile = await exchangeCodeForProfile(code, googleRedirectUri(req));

    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) return fail(req, "google_not_configured");

    // The backend trusts this call only because of the shared internal key, so a
    // browser cannot POST a made-up Google identity to it directly.
    const res = await fetch(`${API_BASE_SERVER}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      }),
      cache: "no-store",
    });
    if (!res.ok) return fail(req, "google_signin_failed");

    const data = (await res.json()) as {
      token: string;
      maxAgeSeconds: number;
    };

    const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const done = NextResponse.redirect(new URL(target, req.url));
    done.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.maxAgeSeconds,
    });
    done.cookies.delete(OAUTH_STATE_COOKIE);
    return done;
  } catch {
    return fail(req, "google_signin_failed");
  }
}
