"use client";

import type { ReactNode } from "react";

/**
 * An in-page anchor that always scrolls smoothly to a target on the same page.
 *
 * A plain `<a href="#id">` (or a Next `<Link>`) leaves the scroll up to the
 * router/browser, which may jump instantly. Handling the click ourselves and
 * calling scrollIntoView guarantees the smooth animation, and respects a
 * reduced-motion preference. scrollIntoView honours the target's
 * `scroll-margin-top`, so it lands clear of the sticky header.
 */
export function ScrollLink({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(targetId);
        // If the target isn't found, fall back to the browser's default jump.
        if (!el) return;
        e.preventDefault();
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        // Keep the URL in sync without triggering a second (instant) jump.
        history.replaceState(null, "", `#${targetId}`);
      }}
    >
      {children}
    </a>
  );
}
