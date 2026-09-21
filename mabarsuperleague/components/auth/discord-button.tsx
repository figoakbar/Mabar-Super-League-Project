"use client";

/**
 * Starts the Discord flow. A plain link (not fetch) because the browser has to
 * follow the redirect to Discord's authorization screen itself.
 */
export function DiscordButton({
  next,
  label = "Continue with Discord",
}: {
  next?: string;
  label?: string;
}) {
  const href = next
    ? `/api/auth/discord?next=${encodeURIComponent(next)}`
    : "/api/auth/discord";

  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-white/[0.14] bg-white/[0.04] p-3.5 font-baloo text-[15.5px] font-extrabold text-white transition hover:-translate-y-px hover:bg-white/[0.08] active:translate-y-px"
    >
      <DiscordMark />
      {label}
    </a>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] shrink-0">
      <path
        fill="#5865F2"
        d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.8 19.8 0 0 0-4.9 1.5C.6 9.1-.2 13.6.2 18a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.7.4-1.3.7-2 1l1.2 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.4-13.6ZM8 15.3c-1.2 0-2.1-1.1-2.1-2.4S6.8 10.5 8 10.5s2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Zm8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4Z"
      />
    </svg>
  );
}
