import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { COMPLETE_PROFILE_PATH } from "@/lib/auth/constants";
import { getSessionToken } from "@/lib/auth/session";

export type Provider = "google" | "discord";

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
  /** Which sign-in identities are bound to the account. */
  providers: Provider[];
  /** False until the mandatory first-sign-in profile step is done. */
  profileComplete: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/**
 * Authoritative session check, run close to the data as the Next.js auth guide
 * recommends. `cache()` de-duplicates it across every component in one render,
 * so a page that checks auth in several places still makes one backend call.
 * It never redirects itself — the helpers below decide that — so the cached
 * value is a plain fact, not a thrown navigation.
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

/** The profile step, remembering where the player was headed. */
function onboardingPath(next: string): string {
  return `${COMPLETE_PROFILE_PATH}?next=${encodeURIComponent(next)}`;
}

/**
 * A valid session, complete or not. Only the profile step itself should use
 * this — everything else wants `requireUser`, which also insists the player has
 * finished that step.
 */
export async function requireSession(next = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) signOutAndRedirect(next);
  return user;
}

/** For pages that require a signed-in player who has completed their profile. */
export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await requireSession(next);
  if (!user.profileComplete) redirect(onboardingPath(next));
  return user;
}

/**
 * For pages a guest may read but a signed-in player should not wander around
 * before finishing their profile: the user if any, redirected to the profile
 * step when signed in but incomplete.
 */
export async function getViewer(next: string): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (user && !user.profileComplete) redirect(onboardingPath(next));
  return user;
}

/**
 * For the admin area. A signed-in non-admin is sent to the dashboard: they have
 * a valid session, they simply have no business here, so there is nothing to
 * clear and no reason to confirm what lives at this path.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}
