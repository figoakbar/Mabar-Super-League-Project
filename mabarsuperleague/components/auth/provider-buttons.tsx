"use client";

import { DiscordButton } from "@/components/auth/discord-button";
import { GoogleButton } from "@/components/auth/google-button";
import { authCardClass } from "@/components/auth/styles";

/** Reasons the OAuth routes send back as `?error=`, in words a player can act on. */
const CODE_MESSAGES: Record<string, string> = {
  session_expired: "Your session expired. Please sign in again.",

  google_not_configured: "Google sign-in isn't set up on this server yet.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state_missing: "That Google sign-in expired. Please try again.",
  google_state_mismatch: "That Google sign-in could not be verified. Try again.",
  google_signin_failed: "Google sign-in failed. Please try again.",

  discord_not_configured: "Discord sign-in isn't set up on this server yet.",
  discord_cancelled: "Discord sign-in was cancelled.",
  discord_state_missing: "That Discord sign-in expired. Please try again.",
  discord_state_mismatch: "That Discord sign-in could not be verified. Try again.",
  discord_signin_failed: "Discord sign-in failed. Please try again.",
  discord_email_unverified:
    "Your Discord email isn't verified. Verify it in Discord's settings, or sign in with Google.",
};

/**
 * The whole sign-in surface: there are no passwords, so signing in and signing
 * up are the same action. A first-time player is taken through the profile
 * step right after.
 */
export function ProviderButtons({
  next,
  errorCode,
  googleEnabled,
  discordEnabled,
  missingEnv,
}: {
  next?: string;
  errorCode?: string;
  googleEnabled: boolean;
  discordEnabled: boolean;
  /** Names of OAuth variables still empty. Development only — see login/page.tsx. */
  missingEnv?: string[];
}) {
  const error = errorCode ? (CODE_MESSAGES[errorCode] ?? "Sign-in failed. Please try again.") : null;
  const anyEnabled = googleEnabled || discordEnabled;

  return (
    <div className={`${authCardClass} max-w-[380px]`}>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          {error}
        </p>
      )}

      {googleEnabled && <GoogleButton next={next} />}
      {discordEnabled && <DiscordButton next={next} />}

      {!anyEnabled && (
        <p className="text-center text-[13px] font-semibold text-white/45">
          Sign-in isn&apos;t configured on this server yet.
        </p>
      )}

      {missingEnv && missingEnv.length > 0 && (
        <p
          className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed"
          style={{
            border: "1px dashed rgba(255,184,0,0.35)",
            background: "rgba(255,184,0,0.07)",
            color: "rgba(255,184,0,0.85)",
          }}
        >
          <strong className="font-extrabold">DEV</strong> — still empty in{" "}
          <code style={{ fontFamily: "monospace" }}>.env.local</code>:{" "}
          <code style={{ fontFamily: "monospace" }}>
            {missingEnv.join(", ")}
          </code>
          . Fill them in, then restart the dev server — Next only reads that
          file at startup. This note never appears in production.
        </p>
      )}

      <p className="text-center text-[12.5px] font-semibold leading-relaxed text-white/40">
        New here? Signing in creates your account — you&apos;ll pick a username
        and add your gamer IDs right after.
      </p>
    </div>
  );
}
