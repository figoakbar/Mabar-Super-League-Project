"use client";

import { passwordRules } from "@/lib/auth/password";

/**
 * A live checklist under the password field. Every rule is visible from the
 * start, so people know what is expected before they are told off — and each
 * one turns green the moment it is met. Once the user has typed something, a
 * rule still outstanding is shown in red rather than left grey, because a
 * silent hint is how a rejected password ends up looking like nothing happened.
 */
export function PasswordRules({
  password,
  username,
  email,
}: {
  password: string;
  username?: string;
  email?: string;
}) {
  const rules = passwordRules(password, { username, email });
  const typing = password.length > 0;

  return (
    <ul className="-mt-0.5 flex flex-col gap-1" aria-live="polite">
      {rules.map((rule) => {
        const tone = rule.ok
          ? "text-[#6FCF97]"
          : typing
            ? "text-[#FF8A80]"
            : "text-white/35";
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-[11.5px] font-semibold ${tone}`}
          >
            <span aria-hidden className="w-3 text-center">
              {rule.ok ? "✓" : typing ? "✕" : "•"}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
