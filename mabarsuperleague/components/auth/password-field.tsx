"use client";

import { useState } from "react";

export function PasswordField() {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="password"
          className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65"
        >
          PASSWORD
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
        id="password"
        name="password"
        type={show ? "text" : "password"}
        placeholder="••••••••"
        required
        className="w-full rounded-xl border border-white/[0.12] bg-[#101015] px-3.5 py-3 text-[14.5px] font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFC833]/70"
      />
    </div>
  );
}
