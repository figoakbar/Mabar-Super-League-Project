"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { logout } from "@/lib/auth/actions";

const itemClass =
  "block border-b border-white/[0.05] py-3.5 text-[12.5px] font-bold tracking-[1.5px] transition-colors";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({
  links,
  isLoggedIn,
}: {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="grid size-9 cursor-pointer place-items-center rounded-lg border border-white/[0.14] text-white transition-colors hover:bg-white/[0.08]"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-white/[0.08] bg-[#0A0B0D]/95 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur">
          <nav className="flex flex-col px-6 py-2">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`${itemClass} ${
                    active
                      ? "text-[#FFB800] underline decoration-2 underline-offset-4"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isLoggedIn ? (
              <form action={logout}>
                <button
                  type="submit"
                  className={`${itemClass} w-full cursor-pointer border-b-0 text-left text-white/60 hover:text-white`}
                >
                  LOG OUT
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={`${itemClass} text-white/60 hover:text-white`}
                >
                  LOG IN
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={`${itemClass} border-b-0 text-[#FFB800] hover:brightness-110`}
                >
                  SIGN UP
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
