import type { ReactNode } from "react";

import { TournamentTabs } from "@/components/home/tournament-tabs";
import { Avatar } from "@/components/shared/user-menu";
import { api, API_ORIGIN } from "@/lib/admin/api";
import { requireUser } from "@/lib/auth/dal";
import { accentFor, avatarSrc } from "@/lib/data/tournament-view";

// Shown when a section genuinely has nothing to display yet.
function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
      {children}
    </div>
  );
}

type MatchRow = {
  id: string;
  opponent: string;
  won: boolean;
  score: string;
  tournament: string;
  round: string;
};

export default async function HomePage() {
  // The dashboard is personal, so an invalid session is cleared rather than
  // silently rendered as an anonymous "Player".
  const user = await requireUser("/");
  const username = user.username;
  const initials = username.slice(0, 2).toUpperCase();
  const photo = avatarSrc(user.avatarUrl, API_ORIGIN);

  // Real career stats: the same figures the public Players directory shows,
  // plus this player's own completed matches for the history list.
  let wins = 0;
  let losses = 0;
  let trophies = 0;
  let records: { game: string; w: number; l: number; points: number }[] = [];
  const gameCounts: Record<string, number> = {};
  let history: MatchRow[] = [];
  try {
    const [players, matches] = await Promise.all([
      api.listPlayers(),
      api.listMatches(),
    ]);
    const me = players.find((p) => p.username === username);
    if (me) {
      wins = me.wins;
      losses = me.losses;
      trophies = me.trophies;
      records = me.records;
      // How many tournaments this player has joined, per game.
      for (const t of me.tournaments) {
        gameCounts[t.game] = (gameCounts[t.game] ?? 0) + 1;
      }
    }
    history = matches
      .filter(
        (m) =>
          m.status === "completed" &&
          m.tournament?.tier !== "exhibition" &&
          m.scoreA != null &&
          m.scoreB != null &&
          (m.teamA === username || m.teamB === username),
      )
      .reverse()
      .slice(0, 6)
      .map((m) => {
        const isA = m.teamA === username;
        const my = (isA ? m.scoreA : m.scoreB) as number;
        const opp = (isA ? m.scoreB : m.scoreA) as number;
        return {
          id: m.id,
          opponent: isA ? m.teamB : m.teamA,
          won: my > opp,
          score: `${my}–${opp}`,
          tournament: m.tournament?.name ?? "",
          round: m.round,
        };
      });
  } catch {
    // Backend unreachable — fall back to zeros / empty states.
  }

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
              Your IAGL dashboard
            </span>
          </div>
        </div>

        <div className="flex gap-8 rounded-[10px] border border-white/[0.08] bg-[#101114] px-7 py-4">
          {(
            [
              [wins, "WINS", "#6FCF97"],
              [losses, "LOSSES", "#E07A72"],
              [trophies, "TROPHIES", "#FFB800"],
            ] as const
          ).map(([value, label, color], i) => (
            <div key={label} className="flex items-center gap-8">
              {i > 0 && <div className="h-9 w-px bg-white/[0.08]" />}
              <div className="flex flex-col gap-0.5">
                <span
                  className="font-display text-[26px] font-bold leading-none"
                  style={{ color }}
                >
                  {value}
                </span>
                <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competition records */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
          Competition Records
        </h2>
        {records.length === 0 ? (
          <EmptyCard>
            No competition records yet — your record per game shows up here once
            you start playing.
          </EmptyCard>
        ) : (
          // Cards sit side by side and scroll horizontally once they run out of
          // room, so a player with many games gets a slider instead of overflow.
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {records.map((r) => {
              const count = gameCounts[r.game] ?? 0;
              return (
                <div
                  key={r.game}
                  className="w-[180px] shrink-0 overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#101114]"
                >
                  <div
                    className="h-[3px]"
                    style={{ background: accentFor(r.game) }}
                  />
                  <div className="flex flex-col gap-2 p-4">
                    <span className="truncate font-display text-[15px] font-extrabold text-white">
                      {r.game}
                    </span>
                    <div className="font-display text-lg font-extrabold">
                      <span className="text-[#6FCF97]">{r.w}W</span>
                      <span className="text-white/25"> · </span>
                      <span className="text-[#E07A72]">{r.l}L</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-base font-extrabold text-[#FFB800]">
                        {r.points.toLocaleString("en-US")}
                      </span>
                      <span className="text-[10px] font-extrabold tracking-[0.5px] text-white/40">
                        PTS
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-white/40">
                      {count} tournament{count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tournaments + match history */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <TournamentTabs username={username} />

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
            Match History
          </h2>
          {history.length === 0 ? (
            <EmptyCard>
              No matches played yet — your recent results will appear here.
            </EmptyCard>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-[10px] border border-white/[0.08] bg-[#101114] px-4 py-3"
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-md font-display text-sm font-extrabold"
                    style={{
                      background: h.won
                        ? "rgba(111,207,151,0.14)"
                        : "rgba(224,122,114,0.14)",
                      color: h.won ? "#6FCF97" : "#E07A72",
                    }}
                  >
                    {h.won ? "W" : "L"}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13.5px] font-extrabold text-white">
                      vs {h.opponent}
                    </span>
                    <span className="truncate text-[11.5px] font-semibold text-white/40">
                      {[h.tournament, h.round].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <span className="shrink-0 font-display text-sm font-extrabold text-white/80">
                    {h.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
