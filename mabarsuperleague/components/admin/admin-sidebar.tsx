"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  X,
  Trophy,
  Swords,
  Shuffle,
  UserCog,
  ClipboardCheck,
  ChartColumn,
  CalendarRange,
  ArrowLeft,
} from "lucide-react";

import { IaglMark } from "@/components/shared/iagl-mark";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/seasons", label: "Seasons", icon: CalendarRange },
  {
    href: "/admin/registrations",
    label: "Registrations",
    icon: ClipboardCheck,
  },
  // Draw the groups / bracket first; a tournament only reaches Matches & Scores
  // once it has been drawn here.
  { href: "/admin/drawing", label: "Drawing", icon: Shuffle },
  { href: "/admin/matches", label: "Matches & Scores", icon: Swords },
  // Participants are managed inside each tournament row on /admin/tournaments.
  { href: "/admin/reports", label: "Reports", icon: ChartColumn },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar({ username }: { username?: string }) {
  const pathname = usePathname();
  // Phone layout only: the nav folds behind a menu button. Desktop always shows it.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const navLinks = (onNavigate?: () => void) =>
    links.map((link) => {
      const active = link.exact
        ? pathname === link.href
        : pathname === link.href || pathname.startsWith(`${link.href}/`);
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
          className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
            active
              ? "bg-[#FFB800]/[0.12] text-[#FFB800]"
              : "text-white/55 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Icon className="size-4" />
          {link.label}
        </Link>
      );
    });

  const close = () => setOpen(false);

  return (
    <aside className="relative flex shrink-0 flex-col gap-1 border-b border-white/[0.08] p-4 md:w-60 md:border-b-0 md:border-r md:p-5">
      <div className="flex items-center justify-between gap-3 px-2 md:mb-4">
        <div className="flex items-center gap-2.5">
          <IaglMark className="size-8" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-extrabold tracking-wide text-white">
              IAGL Admin
            </span>
            <span className="text-[10px] font-bold text-white/35">
              {username ? `Signed in as ${username}` : "Control panel"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          aria-expanded={open}
          aria-controls="admin-menu"
          className="grid size-9 cursor-pointer place-items-center rounded-lg border border-white/[0.14] text-white transition-colors hover:bg-white/[0.08] md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Phone: a panel that drops below the bar, like the site's own menu. */}
      {open && (
        <div
          id="admin-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-white/[0.08] bg-[#0A0B0D]/95 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur md:hidden"
        >
          <nav aria-label="Admin" className="flex flex-col gap-1 p-4">
            {navLinks(close)}
            <Link
              href="/"
              onClick={close}
              className="mt-2 flex items-center gap-2 rounded-lg border-t border-white/[0.07] px-3 pb-1 pt-4 text-sm font-bold text-white/40 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to site
            </Link>
          </nav>
        </div>
      )}

      {/* Desktop: the permanent sidebar. */}
      <nav aria-label="Admin" className="hidden flex-col gap-1 md:flex">
        {navLinks()}
      </nav>

      <Link
        href="/"
        className="mt-auto hidden items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white/40 transition-colors hover:text-white md:flex"
      >
        <ArrowLeft className="size-4" />
        Back to site
      </Link>
    </aside>
  );
}
