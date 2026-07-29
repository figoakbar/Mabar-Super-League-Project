import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * The cookie holds an opaque session token issued by the backend — never the
 * username and never anything the browser should be able to read, so it is
 * httpOnly and (in production) Secure.
 */
export async function setSessionCookie(token: string, maxAgeSeconds?: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without maxAge this is a browser-session cookie: it disappears when the
    // browser closes. That is the "remember me unchecked" behaviour.
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
  });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
