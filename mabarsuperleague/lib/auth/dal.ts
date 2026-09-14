import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { getSessionToken } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  phone: string;
  consoleId: string;
  pcId: string;
  instagram: string;
  avatarUrl: string;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/**
 * Authoritative session check, run close to the data as the Next.js auth guide
 * recommends. `cache()` de-duplicates it across every component in one render,
 * so a page that checks auth in several places still makes one backend call.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_SERVER}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { user: SessionUser };
    return body.user;
  } catch {
    // Backend unreachable — treat as signed out rather than crashing the page.
    return null;
  }
});

/**
 * Where to send someone whose cookie exists but is no longer a valid session.
 * A page cannot delete a cookie mid-render, so this route handler does it —
 * otherwise a stale cookie would bounce between Proxy and the page forever.
 */
function signOutAndRedirect(next: string): never {
  redirect(`/api/auth/signout?expired=1&next=${encodeURIComponent(next)}`);
}

/** For pages that require any signed-in user. */
export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) signOutAndRedirect(next);
  return user;
}

/**
 * For the admin area. A signed-in non-admin is sent to the dashboard: they have
 * a valid session, they simply have no business here, so there is nothing to
 * clear and no reason to confirm what lives at this path.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) signOutAndRedirect("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}
