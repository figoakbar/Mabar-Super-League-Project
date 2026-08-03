"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

import { logout } from "@/lib/auth/actions";

export function UserMenu({
  username,
  avatar,
  isAdmin,
}: {
  username: string;
  avatar: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape — expected behaviour for a menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${username}`}
        className="flex cursor-pointer items-center gap-2 rounded-full border p-[3px] pr-2.5 transition-colors"
        style={{
          borderColor: open ? "rgba(255,184,0,0.5)" : "rgba(255,255,255,0.14)",
          background: open ? "rgba(255,184,0,0.08)" : "transparent",
        }}
      >
        <Avatar username={username} avatar={avatar} size={30} />
        <span className="max-w-[110px] truncate text-[12.5px] font-bold text-white/70">
          {username}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-xl border border-white/[0.1] bg-[#15151b] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
            <Avatar username={username} avatar={avatar} size={38} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-extrabold text-white">
                {username}
              </span>
              <span className="text-[11px] font-bold text-white/35">
                {isAdmin ? "Administrator" : "Player"}
              </span>
            </div>
          </div>

          <div className="flex flex-col py-1.5">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <UserIcon className="size-4" />
              My Profile
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <ShieldCheck className="size-4" />
                Admin Panel
              </Link>
            )}

            <form action={logout} className="border-t border-white/[0.07] pt-1.5">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-bold text-[#FF8A80] transition-colors hover:bg-[#FF8A80]/[0.08]"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** Profile picture, falling back to initials when none is set. */
export function Avatar({
  username,
  avatar,
  size = 32,
  rounded = "full",
}: {
  username: string;
  avatar: string | null;
  size?: number;
  /** "full" for the circular avatars, "lg" for the dashboard's square tile. */
  rounded?: "full" | "lg";
}) {
  const [broken, setBroken] = useState(false);

  // The size lives on this container, never on the <img>. Tailwind's preflight
  // sets `img { max-width: 100% }`, so an image asked to size itself inside a
  // flex parent that has no width of its own collapses to 0. Pinning the box
  // here — with `flex: 0 0 <size>` so it cannot grow or shrink either — gives
  // the image a definite containing block, whatever the surrounding layout is.
  //
  // Every geometry-critical property is an inline style rather than a Tailwind
  // class. Inline styles are immune to a stale/partial compiled stylesheet, so
  // the picture can never render squished even if the CSS bundle is out of date.
  const box: React.CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    overflow: "hidden",
    borderRadius: rounded === "lg" ? 10 : "9999px",
    display: "block",
  };
  const fill: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  return (
    <span style={box} aria-hidden={avatar && !broken ? undefined : true}>
      {avatar && !broken ? (
        // A plain <img>: avatars come from the API origin (and Google), which
        // next/image would need explicit remote-pattern config for.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={size}
          height={size}
          onError={() => setBroken(true)}
          style={fill}
        />
      ) : (
        <span
          className="grid place-items-center bg-[#FFB800] font-display font-extrabold text-[#0A0B0D]"
          style={{ ...fill, fontSize: Math.round(size * 0.4) }}
        >
          {username.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
