"use server";

import { redirect } from "next/navigation";

import { passwordProblems } from "@/lib/auth/password";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { AFTER_LOGIN, LOGIN_PATH } from "@/lib/auth/constants";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";

/** Shape returned to the forms via useActionState. */
export type AuthState = {
  error?: string;
  /** Field-level errors, keyed by input name. */
  fieldErrors?: Record<string, string>;
  /** Non-error notice (e.g. "check your email"). */
  notice?: string;
  /** Dev-only reset link surfaced when SMTP is not configured. */
  devLink?: string;
};

type SessionResponse = {
  token: string;
  maxAgeSeconds: number;
  user: { role: string };
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

/** True when "remember me" was ticked. */
function wantsRemember(formData: FormData): boolean {
  const v = formData.get("remember");
  return v === "on" || v === "true";
}

/** Only allow same-site relative redirects, so `?next=` cannot bounce offsite. */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : AFTER_LOGIN;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = wantsRemember(formData);
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const { ok, payload } = await post("/auth/login", {
    email,
    password,
    remember,
  });
  if (!ok) {
    return { error: messageFrom(payload, "Email or password is incorrect.") };
  }

  const data = payload as SessionResponse;
  // Remember me → persistent cookie. Otherwise a browser-session cookie that
  // disappears when the browser closes.
  await setSessionCookie(data.token, remember ? data.maxAgeSeconds : undefined);
  redirect(next);
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password !== confirm) {
    return { fieldErrors: { confirmPassword: "Passwords don't match." } };
  }
  const regProblems = passwordProblems(password, {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (regProblems.length) {
    return { fieldErrors: { password: regProblems[0] } };
  }
  // Consent is checked here, not only by disabling the button: an unticked box
  // is simply absent from the form data, so this is the gate that actually holds.
  if (formData.get("agree") == null) {
    return {
      fieldErrors: { agree: "Please accept the Terms and Privacy Policy." },
    };
  }

  const { ok, payload } = await post("/auth/register", {
    email: String(formData.get("email") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    password,
    phone: String(formData.get("phone") ?? "").trim(),
    consoleId: String(formData.get("consoleId") ?? "").trim(),
    pcId: String(formData.get("pcId") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    agree: true,
    remember: true,
  });
  if (!ok) {
    return { error: messageFrom(payload, "Could not create your account.") };
  }

  const data = payload as SessionResponse;
  await setSessionCookie(data.token, data.maxAgeSeconds);
  redirect(AFTER_LOGIN);
}

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email you signed up with." };

  const { ok, payload } = await post("/auth/forgot-password", { email });
  if (!ok) {
    return { error: messageFrom(payload, "Could not send the reset link.") };
  }
  const data = payload as { message: string; devLink?: string };
  return { notice: data.message, devLink: data.devLink };
}

export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "This reset link is missing its token." };
  const resetProblems = passwordProblems(password);
  if (resetProblems.length) {
    return { fieldErrors: { password: resetProblems[0] } };
  }
  if (password !== confirm) {
    return { fieldErrors: { confirmPassword: "Passwords don't match." } };
  }

  const { ok, payload } = await post("/auth/reset-password", {
    token,
    password,
  });
  if (!ok) {
    return { error: messageFrom(payload, "Could not reset your password.") };
  }
  // Every old session was revoked server-side; send them to a clean login.
  await clearSessionCookie();
  redirect(`${LOGIN_PATH}?reset=1`);
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
