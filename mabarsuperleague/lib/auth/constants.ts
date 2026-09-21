export const SESSION_COOKIE = "msl_session";

/** CSRF state cookie for the OAuth round-trip (Google and Discord share it). */
export const OAUTH_STATE_COOKIE = "msl_oauth_state";

/** Where users land after signing in, and where they are sent to sign in. */
export const AFTER_LOGIN = "/";
export const LOGIN_PATH = "/login";
/** The mandatory first-sign-in step. */
export const COMPLETE_PROFILE_PATH = "/complete-profile";

/**
 * Only allow same-site relative redirects, so a `?next=` from a link or a
 * callback can never bounce someone off to another origin.
 */
export function safeNext(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : AFTER_LOGIN;
}
