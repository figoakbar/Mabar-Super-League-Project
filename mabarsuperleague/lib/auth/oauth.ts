import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_SERVER } from "@/lib/admin/api";
import {
  COMPLETE_PROFILE_PATH,
  LOGIN_PATH,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  safeNext,
} from "@/lib/auth/constants";

export type Provider = "google" | "discord";

/** What every provider adapter resolves an authorization code into. */
export type OAuthProfile = {
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

type OAuthState = { nonce: string; next: string; provider: Provider };

/**
 * The state cookie carries the CSRF nonce, the post-login target and which
 * provider started the round-trip, packed as base64url JSON so a `next` that
 * contains ":" or any other character survives intact.
 */
export function encodeState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeState(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString()) as Partial<OAuthState>;
    if (
      typeof parsed.nonce !== "string" ||
      typeof parsed.next !== "string" ||
      (parsed.provider !== "google" && parsed.provider !== "discord")
    ) {
      return null;
    }
    return { nonce: parsed.nonce, next: parsed.next, provider: parsed.provider };
  } catch {
    return null;
  }
}

export function newNonce(): string {
  return randomBytes(16).toString("base64url");
}

/** Constant-time comparison for the CSRF nonce. */
export function sameString(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Step 1 of any provider: redirect to its consent screen with a state cookie. */
export function beginSignIn(req: NextRequest, provider: Provider, authorizeUrl: URL) {
  const nonce = newNonce();
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  authorizeUrl.searchParams.set("state", nonce);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, encodeState({ nonce, next, provider }), {
    ...COOKIE_OPTS,
    maxAge: 600, // the round-trip should take seconds, not hours
  });
  return res;
}

/** Bounce back to sign-in with a provider-prefixed reason the page can explain. */
export function failSignIn(req: NextRequest, provider: Provider, reason: string) {
  const res = NextResponse.redirect(
    new URL(`${LOGIN_PATH}?error=${encodeURIComponent(`${provider}_${reason}`)}`, req.url),
  );
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}

/**
 * Validate the callback's state against the cookie. Returns the stored state
 * on success, or the failure reason to hand to `failSignIn`.
 */
export function checkState(
  req: NextRequest,
  provider: Provider,
): { ok: true; state: OAuthState } | { ok: false; reason: string } {
  const returned = req.nextUrl.searchParams.get("state");
  const stored = decodeState(req.cookies.get(OAUTH_STATE_COOKIE)?.value);
  if (!returned || !stored) return { ok: false, reason: "state_missing" };
  if (stored.provider !== provider || !sameString(returned, stored.nonce)) {
    return { ok: false, reason: "state_mismatch" };
  }
  return { ok: true, state: stored };
}

/**
 * Last step of any provider: hand the verified identity to the backend, mint
 * our own session, and send the player on — to the profile step first if they
 * have not completed it.
 *
 * The backend trusts this call only because of the shared internal key, so a
 * browser cannot POST a made-up identity to it directly.
 */
export async function finishSignIn(
  req: NextRequest,
  provider: Provider,
  profile: OAuthProfile,
  next: string,
) {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return failSignIn(req, provider, "not_configured");

  const forwardedFor = req.headers.get("x-forwarded-for");
  const res = await fetch(`${API_BASE_SERVER}/auth/${provider}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": internalKey,
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      ...(req.headers.get("user-agent")
        ? { "User-Agent": req.headers.get("user-agent") as string }
        : {}),
    },
    body: JSON.stringify(profile),
    cache: "no-store",
  });
  if (!res.ok) return failSignIn(req, provider, "signin_failed");

  const data = (await res.json()) as {
    token: string;
    maxAgeSeconds: number;
    user: { profileComplete: boolean };
  };

  const target = safeNext(next);
  const destination = data.user.profileComplete
    ? target
    : `${COMPLETE_PROFILE_PATH}?next=${encodeURIComponent(target)}`;

  const done = NextResponse.redirect(new URL(destination, req.url));
  done.cookies.set(SESSION_COOKIE, data.token, {
    ...COOKIE_OPTS,
    maxAge: data.maxAgeSeconds,
  });
  done.cookies.delete(OAUTH_STATE_COOKIE);
  return done;
}
