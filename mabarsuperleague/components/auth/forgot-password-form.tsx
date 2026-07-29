"use client";

import { useActionState } from "react";
import Link from "next/link";

import { authInputClass } from "@/components/auth/password-field";
import { forgotPassword, type AuthState } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    forgotPassword,
    {},
  );

  return (
    <form
      action={formAction}
      className="mt-2.5 flex w-full max-w-[400px] flex-col gap-3.5 rounded-3xl border border-white/[0.09] bg-[#15151b]/90 p-7 pb-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      {state.notice ? (
        <>
          <p className="rounded-xl border border-[#7EE8A2]/30 bg-[#7EE8A2]/10 px-3.5 py-3 text-[13.5px] font-bold text-[#7EE8A2]">
            {state.notice}
          </p>
          {state.devLink && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-[#FFC833]/30 bg-[#FFC833]/[0.08] px-3.5 py-3">
              <span className="text-[11.5px] font-extrabold tracking-[0.4px] text-[#FFC833]">
                DEVELOPMENT MODE — NO EMAIL CONFIGURED
              </span>
              <Link
                href={state.devLink}
                className="break-all text-[12.5px] font-bold text-white/70 underline hover:text-white"
              >
                {state.devLink}
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
            >
              {state.error}
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

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full cursor-pointer rounded-[14px] bg-[#FFB800] p-3.5 font-baloo text-[16.5px] font-extrabold text-[#1A1108] transition hover:-translate-y-px hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send Reset Link"}
          </button>
        </>
      )}

      <div className="text-center text-[13.5px] font-semibold text-white/50">
        <Link
          href="/login"
          className="text-[#FFC833] hover:text-[#FFDD66] hover:underline"
        >
          Back to log in
        </Link>
      </div>
    </form>
  );
}
