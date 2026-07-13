import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/constants";

// NOTE: Mock session — stores the username directly in a cookie.
// Replace with a real signed/encrypted session (e.g. JWT) when a backend exists.

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  return value ? { username: value } : null;
}

export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
