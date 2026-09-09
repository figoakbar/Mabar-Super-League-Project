import Link from "next/link";

import { IaglMark } from "@/components/shared/iagl-mark";
import { IaglWordmark } from "@/components/shared/iagl-wordmark";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { UserMenu } from "@/components/shared/user-menu";
import { API_ORIGIN } from "@/lib/admin/api";
import { getCurrentUser } from "@/lib/auth/dal";
import { avatarSrc } from "@/lib/data/tournament-view";

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
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0B0D]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-6 py-[18px] sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <IaglMark className="size-[40px]" />
          <span className="flex flex-col items-start gap-[3px] leading-none">
            <IaglWordmark className="h-[18px]" />
            <span className="hidden whitespace-nowrap text-[7.5px] font-bold uppercase tracking-[1.4px] text-white/40 sm:block">
              Indonesia Arcadia Gaming League
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-7">
          <NavLinks links={navLinks} />

          {user ? (
            <UserMenu
              username={user.username}
              avatar={avatarSrc(user.avatarUrl, API_ORIGIN)}
              isAdmin={user.role === "admin"}
            />
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

          <MobileNav
            links={navLinks}
            isLoggedIn={Boolean(user)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      </div>
    </header>
  );
}
