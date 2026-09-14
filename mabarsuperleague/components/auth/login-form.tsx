"use client";

import { useActionState } from "react";
import Link from "next/link";

import { authInputClass, PasswordField } from "@/components/auth/password-field";
import { GoogleButton } from "@/components/auth/google-button";
import { login, type AuthState } from "@/lib/auth/actions";

const CODE_MESSAGES: Record<string, string> = {
  session_expired: "Your session expired. Please log in again.",
  google_not_configured:
    "Google sign-in isn't configured on this server yet. Use your email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state_missing: "That Google sign-in expired. Please try again.",
  google_state_mismatch: "That Google sign-in could not be verified. Try again.",
  google_signin_failed: "Google sign-in failed. Try again or use your password.",
};

export function LoginForm({
  next,
  notice,
  errorCode,
}: {
  next?: string;
  notice?: string;
  errorCode?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    {},
  );

  const error = state.error ?? (errorCode ? CODE_MESSAGES[errorCode] : undefined);

  return (
    <form
      action={formAction}
      className="mt-2.5 flex w-full max-w-[380px] flex-col gap-3.5 rounded-3xl border border-white/[0.09] bg-[#15151b]/90 p-7 pb-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      {next && <input type="hidden" name="next" value={next} />}

      {notice && (
        <p className="rounded-xl border border-[#7EE8A2]/30 bg-[#7EE8A2]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#7EE8A2]">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65"
        >
          EMAIL
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
          className={authInputClass}
        />
      </div>

      <PasswordField autoComplete="current-password" />

      <div className="mt-0.5 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold text-white/55">
          <input
            type="checkbox"
            name="remember"
            className="size-[15px] accent-[#FFB800]"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] font-bold text-[#FFC833] hover:text-[#FFDD66] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1.5 w-full cursor-pointer rounded-[14px] bg-[#FFB800] p-3.5 font-baloo text-[16.5px] font-extrabold text-[#1A1108] transition hover:-translate-y-px hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log In Now"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.1]" />
        <span className="text-[11.5px] font-bold tracking-[0.5px] text-white/30">
          OR
        </span>
        <span className="h-px flex-1 bg-white/[0.1]" />
      </div>

      <GoogleButton next={next} />

      <div className="text-center text-[13.5px] font-semibold text-white/50">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[#FFC833] hover:text-[#FFDD66] hover:underline"
        >
          Sign up free
        </Link>
      </div>
    </form>
  );
}
