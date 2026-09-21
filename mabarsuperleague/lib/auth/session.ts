import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * The cookie holds an opaque session token issued by the backend — never the
 * username and never anything the browser should be able to read, so it is
 * httpOnly and (in production) Secure. It is set by the OAuth callbacks on the
 * redirect response itself; here we only read and clear it.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
