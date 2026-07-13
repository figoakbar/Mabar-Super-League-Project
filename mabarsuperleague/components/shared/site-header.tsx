import Link from "next/link";
import { LogOut } from "lucide-react";

import { logout } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-[#ff2d95]/25 bg-[#160d2b]/85 shadow-[0_1px_30px_rgba(255,45,149,.12)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff2d95] to-[#4dd8f0] font-display text-sm font-bold text-[#12091e] shadow-[0_0_18px_rgba(255,45,149,.5)]">
              M
            </span>
            <span className="font-display text-lg font-bold tracking-wide text-[#eaf0ff]">
              MSL<span className="text-[#ffc75b]">.LEAGUE</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-sm font-medium text-[#9b8fc0] transition-colors hover:text-[#ffc75b]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {session ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#9b8fc0] sm:inline">
              @{session.username}
            </span>
            <span className="size-9 rounded-full border-2 border-[#4dd8f0] bg-[#1a1130] shadow-[0_0_14px_rgba(77,216,240,.35)]" />
            <form action={logout}>
              <button
                type="submit"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-display text-sm font-medium text-[#9b8fc0] transition-colors hover:text-[#eaf0ff]"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-[#4dd8f0]/60 px-4 py-1.5 font-display text-sm font-semibold text-[#4dd8f0] transition-colors hover:bg-[#4dd8f0]/10"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#ff2d95] px-4 py-1.5 font-display text-sm font-semibold text-white shadow-[0_0_18px_rgba(255,45,149,.45)] transition-colors hover:bg-[#e0247f]"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
