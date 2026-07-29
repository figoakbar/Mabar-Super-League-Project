import type { ReactNode } from "react";

import { TournamentTabs } from "@/components/home/tournament-tabs";
import { Avatar } from "@/components/shared/user-menu";
import { API_ORIGIN } from "@/lib/admin/api";
import { requireUser } from "@/lib/auth/dal";
import { avatarSrc } from "@/lib/data/tournament-view";

// These sections have no backend source yet, so they render as empty states
// (zeros / "nothing here") rather than fabricated numbers.
function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
      {children}
    </div>
  );
}

export default async function HomePage() {
  // The dashboard is personal, so an invalid session is cleared rather than
  // silently rendered as an anonymous "Player".
  const user = await requireUser("/");
  const username = user.username;
  const initials = username.slice(0, 2).toUpperCase();
  const photo = avatarSrc(user.avatarUrl, API_ORIGIN);

  return (
    <div className="flex flex-col gap-10">
      {/* Profile header */}
      <section className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-[18px]">
          {/* Keep the initials tile when there is no picture, so the dashboard
              looks unchanged for accounts that never uploaded one. */}
          {photo ? (
            <Avatar
              username={username}
              avatar={photo}
              size={72}
              rounded="lg"
            />
          ) : (
            <div className="grid size-[72px] shrink-0 place-items-center rounded-lg border border-white/10 bg-[#16171B]">
              <span className="font-display text-[28px] font-bold text-[#FFB800]">
                {initials}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-3xl font-bold leading-none tracking-[1px] text-white sm:text-[40px]">
              Hi, {username}
            </h1>
            <span className="text-[13px] font-semibold text-white/45">
              Your MSL dashboard
            </span>
          </div>
        </div>

        <div className="flex gap-8 rounded-[10px] border border-white/[0.08] bg-[#101114] px-7 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#6FCF97]">
              0
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              WINS
            </span>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#E07A72]">
              0
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              LOSSES
            </span>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#FFB800]">
              0
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              TROPHIES
            </span>
          </div>
        </div>
      </section>

      {/* Competition records */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
          Competition Records
        </h2>
        <EmptyCard>
          No competition records yet — your win rate per game shows up here once
          you start playing.
        </EmptyCard>
      </section>

      {/* Tournaments + match history */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <TournamentTabs username={username} />

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
            Match History
          </h2>
          <EmptyCard>
            No matches played yet — your recent results will appear here.
          </EmptyCard>
        </section>
      </div>
    </div>
  );
}
