"use client";

import { useState } from "react";

export const authInputClass =
  "w-full rounded-xl border border-white/[0.12] bg-[#101015] px-3.5 py-3 text-[14.5px] font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFC833]/70";

export function PasswordField({
  name = "password",
  label = "PASSWORD",
  value,
  onChange,
  invalid = false,
  autoComplete = "new-password",
  hint,
}: {
  name?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="cursor-pointer text-xs font-bold text-white/45 transition-colors hover:text-white/80"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        placeholder="••••••••"
        required
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        {...(onChange
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : {})}
        className={`${authInputClass} ${invalid ? "border-[#FF8A80]/70" : ""}`}
      />
      {hint && (
        <span className="text-[11.5px] font-semibold text-white/35">{hint}</span>
      )}
    </div>
  );
}
