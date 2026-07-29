"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  UserCog,
  ClipboardCheck,
  ChartColumn,
  ArrowLeft,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  {
    href: "/admin/registrations",
    label: "Registrations",
    icon: ClipboardCheck,
  },
  { href: "/admin/matches", label: "Matches & Scores", icon: Swords },
  // Participants are managed inside each tournament row on /admin/tournaments.
  { href: "/admin/reports", label: "Reports", icon: ChartColumn },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar({ username }: { username?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-1 border-b border-white/[0.08] p-4 md:w-60 md:border-b-0 md:border-r md:p-5">
      <div className="mb-4 flex items-center gap-2.5 px-2">
        <span className="grid size-8 place-items-center rounded-md bg-[#FFB800]">
          <span className="size-2.5 bg-[#0A0B0D]" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-extrabold tracking-wide text-white">
            MSL Admin
          </span>
          <span className="text-[10px] font-bold text-white/35">
            {username ? `Signed in as ${username}` : "Control panel"}
          </span>
        </div>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
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
        })}
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
