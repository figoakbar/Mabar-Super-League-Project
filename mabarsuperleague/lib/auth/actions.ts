"use server";

import { redirect } from "next/navigation";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { LOGIN_PATH, safeNext } from "@/lib/auth/constants";
import { clearSessionCookie, getSessionToken } from "@/lib/auth/session";

/** Shape returned to the forms via useActionState. */
export type AuthState = {
  error?: string;
  /** Field-level errors, keyed by input name. */
  fieldErrors?: Record<string, string>;
};

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${API_BASE_SERVER}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // empty body
  }
  return { ok: res.ok, status: res.status, payload };
}

function messageFrom(payload: unknown, fallback: string): string {
  const m = (payload as { message?: string | string[] } | null)?.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return fallback;
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

/**
 * The mandatory first-sign-in step. Field checks here give instant, specific
 * feedback; the backend re-validates everything and is the authority.
 */
export async function completeProfile(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const consoleId = String(formData.get("consoleId") ?? "").trim();
  const pcId = String(formData.get("pcId") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();

  if (username.length < 3 || username.length > 30) {
    return { fieldErrors: { username: "Use 3–30 characters." } };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      fieldErrors: { username: "Only letters, numbers, _ . and - are allowed." },
    };
  }
  if (!phone) {
    return { fieldErrors: { phone: "Add a phone number so admins can reach you." } };
  }
  if (!consoleId && !pcId) {
    return { fieldErrors: { device: "Add at least one gamer ID." } };
  }
  // An unticked box is simply absent from the form data.
  if (formData.get("agree") == null) {
    return {
      fieldErrors: { agree: "Please accept the Terms and Privacy Policy." },
    };
  }

  const token = await getSessionToken();
  if (!token) redirect(LOGIN_PATH);

  const { ok, payload } = await post(
    "/auth/me/complete",
    { username, phone, consoleId, pcId, instagram, agree: true },
    token,
  );
  if (!ok) {
    return { error: messageFrom(payload, "Could not save your profile.") };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const token = await getSessionToken();
  if (token) {
    // Revoke server-side too, so a copied cookie cannot be reused.
    await fetch(`${API_BASE_SERVER}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}
