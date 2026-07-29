"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { PasswordField } from "@/components/auth/password-field";
import { resetPassword, type AuthState } from "@/lib/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    {},
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit = password.length >= 8 && !mismatch && token.length > 0;

  return (
    <form
      action={formAction}
      className="mt-2.5 flex w-full max-w-[400px] flex-col gap-3.5 rounded-3xl border border-white/[0.09] bg-[#15151b]/90 p-7 pb-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <input type="hidden" name="token" value={token} />

      {!token && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          This link is missing its token. Request a new reset link.
        </p>
      )}
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          {state.error}
        </p>
      )}

      <PasswordField
        label="NEW PASSWORD"
        value={password}
        onChange={setPassword}
        invalid={tooShort}
        hint="At least 8 characters."
      />
      <PasswordField
        name="confirmPassword"
        label="CONFIRM NEW PASSWORD"
        value={confirm}
        onChange={setConfirm}
        invalid={mismatch}
      />
      {mismatch && (
        <p className="-mt-1 text-xs font-bold text-[#FF8A80]">
          Passwords don&apos;t match.
        </p>
      )}
      {state.fieldErrors?.password && (
        <p className="-mt-1 text-xs font-bold text-[#FF8A80]">
          {state.fieldErrors.password}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="mt-1 w-full rounded-[14px] p-3.5 font-baloo text-[16.5px] font-extrabold transition enabled:cursor-pointer enabled:hover:-translate-y-px enabled:hover:brightness-110"
        style={{
          background: canSubmit ? "#FFB800" : "rgba(255,255,255,0.06)",
          color: canSubmit ? "#1A1108" : "rgba(255,255,255,0.3)",
        }}
      >
        {pending ? "Saving…" : "Set New Password"}
      </button>

      <p className="text-center text-[12px] font-semibold text-white/35">
        Setting a new password signs you out everywhere else.
      </p>

      <div className="text-center text-[13.5px] font-semibold text-white/50">
        <Link
          href="/forgot-password"
          className="text-[#FFC833] hover:text-[#FFDD66] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    </form>
  );
}
