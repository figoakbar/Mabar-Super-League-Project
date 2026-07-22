import Link from "next/link";

import { MobileNav } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { logout } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/tournaments", label: "TOURNAMENTS" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/players", label: "PLAYERS" },
  { href: "/how-to-play", label: "HOW TO PLAY" },
];

const navClass =
  "text-[12.5px] font-bold tracking-[1.5px] text-white/45 transition-colors hover:text-white";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0B0D]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-6 py-[18px] sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-[30px] place-items-center rounded-md bg-[#FFB800]">
            <span className="size-2.5 bg-[#0A0B0D]" />
          </span>
          <span className="font-display text-base font-bold tracking-[2px] text-white sm:text-xl">
            MABAR SUPER LEAGUE
          </span>
        </Link>

        <div className="flex items-center gap-7">
          <NavLinks links={navLinks} />

          {session ? (
            <form action={logout} className="hidden md:block">
              <button type="submit" className={`cursor-pointer ${navClass}`}>
                LOG OUT
              </button>
            </form>
          ) : (
            <div className="hidden items-center gap-5 md:flex">
              <Link href="/login" className={navClass}>
                LOG IN
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#FFB800] px-4 py-2 text-[12.5px] font-extrabold tracking-[1.5px] text-[#0A0B0D] transition hover:brightness-110"
              >
                SIGN UP
              </Link>
            </div>
          )}

          <MobileNav links={navLinks} isLoggedIn={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
