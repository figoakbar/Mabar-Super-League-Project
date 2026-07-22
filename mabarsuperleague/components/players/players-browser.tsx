"use client";

import { useState } from "react";

type Chip = { bg: string; border: string; color: string };

const goldChip: Chip = { bg: "rgba(255,184,0,0.12)", border: "rgba(255,184,0,0.4)", color: "#FFB800" };
const silverChip: Chip = { bg: "rgba(199,206,220,0.1)", border: "rgba(199,206,220,0.35)", color: "#C7CEDC" };
const neutralChip: Chip = { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" };

const goldBadge: Chip = { bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.35)", color: "#FFB800" };
const neutralBadge: Chip = { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" };

type PlayerRecord = { game: string; w: number; l: number; barW: string; color: string };
type PlayerBadge = Chip & { label: string };
type PlayerTournament = Chip & { name: string; game: string; date: string; result: string };

export type Player = {
  name: string;
  initials: string;
  city: string;
  mainGame: string;
  rank: number;
  pts: string;
  since: string;
  accent: string;
  avatarBg: string;
  w: number;
  l: number;
  trophies: number;
  wr: number;
  isYou?: boolean;
  records: PlayerRecord[];
  badges: PlayerBadge[];
  tournaments: PlayerTournament[];
};

const allPlayers: Player[] = [
  {
    name: "SpeedKing_ID", initials: "SK", city: "Jakarta, ID", mainGame: "Grand Prix", rank: 1, pts: "2,875", since: "2023", accent: "#FFB800", avatarBg: "linear-gradient(160deg, #FFC24B, #F2803B)", w: 58, l: 15, trophies: 3, wr: 79,
    records: [
      { game: "Grand Prix", w: 41, l: 8, barW: "84%", color: "#4FBF8B" },
      { game: "EA FC", w: 12, l: 5, barW: "71%", color: "#4FA3E0" },
      { game: "Arcade Mania", w: 5, l: 2, barW: "71%", color: "#E0A04F" },
    ],
    badges: [
      { label: "🏆 GP Series Champion ×3", ...goldBadge },
      { label: "Fastest Lap — Circuit 7", ...neutralBadge },
      { label: "Season 4 MVP", ...neutralBadge },
    ],
    tournaments: [
      { name: "Grand Prix Series 2026", game: "Grand Prix", date: "Ongoing", result: "Qualifying", ...neutralChip },
      { name: "Grand Prix Series 2025", game: "Grand Prix", date: "Nov 2025", result: "Champion", ...goldChip },
      { name: "GP Sprint Cup", game: "Grand Prix", date: "Jun 2025", result: "Champion", ...goldChip },
    ],
  },
  {
    name: "GoalMachine", initials: "GM", city: "Bandung, ID", mainGame: "EA FC", rank: 2, pts: "2,410", since: "2023", accent: "#4FA3E0", avatarBg: "linear-gradient(160deg, #8E7BFF, #5B3FD4)", w: 51, l: 19, trophies: 2, wr: 73,
    records: [
      { game: "EA FC", w: 44, l: 12, barW: "79%", color: "#4FA3E0" },
      { game: "Fantasy League", w: 7, l: 7, barW: "50%", color: "#8E7BFF" },
    ],
    badges: [
      { label: "🏆 Championship S3 & S4", ...goldBadge },
      { label: "Top Scorer S4", ...neutralBadge },
    ],
    tournaments: [
      { name: "MSL Championship S5", game: "EA FC", date: "Ongoing", result: "Group Stage", ...neutralChip },
      { name: "MSL Championship S4", game: "EA FC", date: "Mar 2026", result: "Runner-up", ...silverChip },
      { name: "MSL Championship S3", game: "EA FC", date: "Okt 2025", result: "Champion", ...goldChip },
    ],
  },
  {
    name: "PixelQueen", initials: "PQ", city: "Bali, ID", mainGame: "Arcade Mania", rank: 3, pts: "2,195", since: "2024", accent: "#D9479A", avatarBg: "linear-gradient(160deg, #D9479A, #A32E72)", w: 44, l: 21, trophies: 2, wr: 68,
    records: [
      { game: "Arcade Mania", w: 38, l: 14, barW: "73%", color: "#E0A04F" },
      { game: "Turbo Ball", w: 6, l: 7, barW: "46%", color: "#D9479A" },
    ],
    badges: [
      { label: "🏆 Arcade Clash Winner ×2", ...goldBadge },
      { label: "Weekly High Score ×8", ...neutralBadge },
    ],
    tournaments: [
      { name: "Arcade Clash Cup", game: "Arcade Mania", date: "Ongoing", result: "Round 1", ...neutralChip },
      { name: "Arcade Clash Cup 2025", game: "Arcade Mania", date: "Des 2025", result: "Champion", ...goldChip },
      { name: "Community League 2025", game: "Turbo Ball", date: "Nov 2025", result: "Quarterfinal", ...neutralChip },
    ],
  },
  {
    name: "CaptainStrike", initials: "CS", city: "Jakarta, ID", mainGame: "Fantasy League", rank: 4, pts: "1,980", since: "2024", accent: "#4FBF8B", avatarBg: "linear-gradient(160deg, #4FBF8B, #2F8A5E)", w: 40, l: 18, trophies: 1, wr: 69,
    records: [
      { game: "Fantasy League", w: 32, l: 11, barW: "74%", color: "#8E7BFF" },
      { game: "EA FC", w: 8, l: 7, barW: "53%", color: "#4FA3E0" },
    ],
    badges: [{ label: "🏆 League Cup S3", ...goldBadge }],
    tournaments: [
      { name: "MSL Championship S5", game: "EA FC", date: "Ongoing", result: "Group Stage", ...neutralChip },
      { name: "League Cup S3", game: "Fantasy League", date: "Sep 2025", result: "Champion", ...goldChip },
      { name: "League Cup S2", game: "Fantasy League", date: "Apr 2025", result: "Semifinal", ...neutralChip },
    ],
  },
  {
    name: "AceHunter", initials: "AH", city: "Bandung, ID", mainGame: "Smash Court", rank: 5, pts: "1,845", since: "2024", accent: "#E06055", avatarBg: "linear-gradient(160deg, #E06055, #A83A31)", w: 31, l: 20, trophies: 1, wr: 61,
    records: [
      { game: "Smash Court", w: 27, l: 15, barW: "64%", color: "#E06055" },
      { game: "Turbo Ball", w: 4, l: 5, barW: "44%", color: "#D9479A" },
    ],
    badges: [{ label: "🏆 Open Cup Winner", ...goldBadge }],
    tournaments: [
      { name: "Smash Court Open — August", game: "Tenis", date: "Ongoing", result: "Registered", ...neutralChip },
      { name: "Tennis Open Cup", game: "Smash Court", date: "Jan 2026", result: "Champion", ...goldChip },
      { name: "Open Cup 2025", game: "Smash Court", date: "Jul 2025", result: "Runner-up", ...silverChip },
    ],
  },
  {
    name: "DimasFC_99", initials: "DM", city: "Surabaya, ID", mainGame: "EA FC", rank: 6, pts: "1,720", since: "2025", accent: "#4FA3E0", avatarBg: "linear-gradient(160deg, #4FA3E0, #2B6FA8)", w: 34, l: 22, trophies: 0, wr: 61,
    records: [
      { game: "EA FC", w: 30, l: 18, barW: "63%", color: "#4FA3E0" },
      { game: "Fantasy League", w: 4, l: 4, barW: "50%", color: "#8E7BFF" },
    ],
    badges: [{ label: "Quarterfinalist S4", ...neutralBadge }],
    tournaments: [
      { name: "MSL Championship S5", game: "EA FC", date: "Ongoing", result: "Group Stage", ...neutralChip },
      { name: "MSL Championship S4", game: "EA FC", date: "Mar 2026", result: "Quarterfinal", ...neutralChip },
      { name: "League Cup S3", game: "Fantasy League", date: "Sep 2025", result: "Group Stage", ...neutralChip },
    ],
  },
  {
    name: "NitroNina", initials: "NN", city: "Medan, ID", mainGame: "Grand Prix", rank: 7, pts: "1,655", since: "2025", accent: "#4FBF8B", avatarBg: "linear-gradient(160deg, #7FE3FF, #2BA3E8)", w: 28, l: 15, trophies: 0, wr: 65,
    records: [
      { game: "Grand Prix", w: 24, l: 11, barW: "69%", color: "#4FBF8B" },
      { game: "Arcade Mania", w: 4, l: 4, barW: "50%", color: "#E0A04F" },
    ],
    badges: [{ label: "Podium ×6", ...neutralBadge }],
    tournaments: [
      { name: "Grand Prix Series 2026", game: "Grand Prix", date: "Ongoing", result: "Qualifying", ...neutralChip },
      { name: "Grand Prix Series 2025", game: "Grand Prix", date: "Nov 2025", result: "Semifinal", ...neutralChip },
      { name: "Arcade Clash Cup 2025", game: "Arcade Mania", date: "Des 2025", result: "Round 2", ...neutralChip },
    ],
  },
  {
    name: "RizkyPratama", initials: "RZ", city: "Jakarta, ID", mainGame: "Grand Prix", rank: 8, pts: "1,590", since: "2024", accent: "#8E7BFF", avatarBg: "linear-gradient(160deg, #8E7BFF, #5B3FD4)", w: 70, l: 43, trophies: 5, wr: 62, isYou: true,
    records: [
      { game: "Grand Prix", w: 12, l: 3, barW: "80%", color: "#4FBF8B" },
      { game: "EA FC", w: 10, l: 5, barW: "67%", color: "#4FA3E0" },
      { game: "Arcade Mania", w: 21, l: 12, barW: "64%", color: "#E0A04F" },
    ],
    badges: [
      { label: "🏆 Championship S4", ...goldBadge },
      { label: "Fastest Lap — Circuit 7", ...neutralBadge },
    ],
    tournaments: [
      { name: "MSL Championship S5", game: "EA FC", date: "Ongoing", result: "Group Stage", ...neutralChip },
      { name: "Grand Prix Series 2026", game: "Grand Prix", date: "Ongoing", result: "Qualifying", ...neutralChip },
      { name: "MSL Championship S4", game: "EA FC", date: "Mar 2026", result: "Champion", ...goldChip },
      { name: "Community League 2025", game: "Turbo Ball", date: "Nov 2025", result: "Runner-up", ...silverChip },
    ],
  },
  {
    name: "ShadowVolt", initials: "SV", city: "Bali, ID", mainGame: "Arcade Mania", rank: 9, pts: "1,470", since: "2025", accent: "#E0A04F", avatarBg: "linear-gradient(160deg, #2E2A45, #1C1926)", w: 25, l: 19, trophies: 0, wr: 57,
    records: [
      { game: "Arcade Mania", w: 21, l: 14, barW: "60%", color: "#E0A04F" },
      { game: "EA FC", w: 4, l: 5, barW: "44%", color: "#4FA3E0" },
    ],
    badges: [{ label: "Weekly High Score ×2", ...neutralBadge }],
    tournaments: [
      { name: "Arcade Clash Cup", game: "Arcade Mania", date: "Ongoing", result: "Round 1", ...neutralChip },
      { name: "Arcade Clash Cup 2025", game: "Arcade Mania", date: "Des 2025", result: "Round 2", ...neutralChip },
      { name: "MSL Championship S4", game: "EA FC", date: "Mar 2026", result: "Group Stage", ...neutralChip },
    ],
  },
  {
    name: "TurboTiger", initials: "TT", city: "Semarang, ID", mainGame: "Turbo Ball", rank: 10, pts: "1,395", since: "2025", accent: "#D9479A", avatarBg: "linear-gradient(160deg, #FF9BD2, #D9479A)", w: 22, l: 16, trophies: 1, wr: 58,
    records: [
      { game: "Turbo Ball", w: 18, l: 11, barW: "62%", color: "#D9479A" },
      { game: "EA FC", w: 4, l: 5, barW: "44%", color: "#4FA3E0" },
    ],
    badges: [{ label: "🏆 Community League S1", ...goldBadge }],
    tournaments: [
      { name: "Community League S2", game: "Turbo Ball", date: "Ongoing", result: "Registered", ...neutralChip },
      { name: "Community League S1", game: "Turbo Ball", date: "Nov 2025", result: "Champion", ...goldChip },
      { name: "MSL Championship S4", game: "EA FC", date: "Mar 2026", result: "Group Stage", ...neutralChip },
    ],
  },
];

const sectionLabel =
  "text-xs font-extrabold tracking-[1px] text-white/40";

export function PlayersBrowser({ username }: { username: string }) {
  const players = allPlayers.map((p) =>
    p.isYou
      ? { ...p, name: username, initials: username.slice(0, 2).toUpperCase() }
      : p,
  );

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(players[0].name);

  const q = query.trim().toLowerCase();

  let shown = players;
  if (q)
    shown = shown.filter(
      (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q),
    );

  const sel = players.find((p) => p.name === selected) ?? players[0];

  return (
    <>
      {/* Header + search */}
      <section className="relative overflow-hidden border-b border-white/[0.08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_30%,transparent_100%)]"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-6 py-11 sm:px-10">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-3xl font-extrabold leading-[1.1] text-white sm:text-[40px]">
              Find <span className="text-[#FFB800]">Players</span>
            </h1>
            <span className="text-sm font-semibold text-white/50">
              2,340 registered players · Search a username to view their profile
            </span>
          </div>

          <div
            className="flex min-w-[240px] max-w-[480px] items-center gap-3 rounded-xl border bg-[#101114] px-[18px] py-[13px]"
            style={{
              borderColor: q ? "rgba(255,184,0,0.45)" : "rgba(255,255,255,0.12)",
            }}
          >
            <span className="text-[15px] text-white/35" aria-hidden>
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username…"
              className="min-w-0 flex-1 border-none bg-transparent text-[14.5px] font-bold text-white outline-none placeholder:text-white/35"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="cursor-pointer text-xs font-extrabold text-white/40 transition-colors hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-7 px-6 pb-20 pt-8 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Player list */}
        <div className="flex flex-col gap-2.5">
          <span className={sectionLabel}>
            {shown.length} PLAYER{shown.length === 1 ? "" : "S"}
            {q ? ` MATCHING "${query.trim().toUpperCase()}"` : ""}
          </span>

          {shown.map((p) => {
            const isSel = p.name === sel.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setSelected(p.name)}
                className="flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] border px-[18px] py-3.5 text-left transition hover:translate-x-1 hover:border-white/25"
                style={{
                  background: isSel ? "rgba(255,184,0,0.06)" : "#101114",
                  borderColor: isSel
                    ? "rgba(255,184,0,0.45)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold text-white"
                  style={{ background: p.avatarBg }}
                >
                  {p.initials}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-extrabold text-white">
                      {p.name}
                    </span>
                    {p.isYou && (
                      <span className="shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2 py-0.5 text-[9.5px] font-extrabold text-[#FFB800]">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs font-bold text-white/40">
                    {p.city} · Main game: {p.mainGame}
                  </span>
                </div>
              </button>
            );
          })}

          {shown.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 rounded-[14px] border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center">
              <span className="font-display text-[17px] font-extrabold text-white">
                No players found
              </span>
              <span className="text-[13px] font-semibold text-white/45">
                Try a different username or clear the filters.
              </span>
            </div>
          )}
        </div>

        {/* Profile panel */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101114] lg:sticky lg:top-24">
          <div className="h-[3px]" style={{ background: sel.accent }} />
          <div className="flex flex-col gap-[18px] p-[26px] pb-6">
            <div className="flex items-center gap-4">
              <div
                className="grid size-[68px] shrink-0 place-items-center rounded-[20px]"
                style={{ background: sel.avatarBg }}
              >
                <span className="font-display text-2xl font-extrabold text-white">
                  {sel.initials}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span className="truncate font-display text-2xl font-extrabold text-white">
                  {sel.name}
                </span>
                <span className="text-[12.5px] font-bold text-white/45">
                  {sel.city} · Member since {sel.since}
                </span>
              </div>
            </div>

            <div className="flex border-y border-white/[0.08] py-3.5">
              {(
                [
                  [sel.w, "WINS", "#6FCF97"],
                  [sel.l, "LOSSES", "#E07A72"],
                  [sel.trophies, "TROPHIES", "#FFB800"],
                  [`${sel.wr}%`, "WIN RATE", "#FFFFFF"],
                ] as const
              ).map(([value, label, color], i) => (
                <div
                  key={label}
                  className={`flex flex-1 flex-col items-center gap-px ${
                    i > 0 ? "border-l border-white/[0.08]" : ""
                  }`}
                >
                  <span
                    className="font-display text-xl font-extrabold"
                    style={{ color }}
                  >
                    {value}
                  </span>
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/40">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={sectionLabel}>GAME RECORDS</span>
              {sel.records.map((g) => (
                <div key={g.game} className="flex items-center gap-3">
                  <span className="w-[110px] shrink-0 text-[13px] font-extrabold text-white">
                    {g.game}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: g.barW, background: g.color }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[12.5px] font-extrabold text-white/60">
                    {g.w}W · {g.l}L
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={sectionLabel}>ACHIEVEMENTS</span>
              <div className="flex flex-wrap gap-2">
                {sel.badges.map((b) => (
                  <div
                    key={b.label}
                    className="rounded-full border px-[13px] py-1.5 text-[11.5px] font-extrabold"
                    style={{
                      background: b.bg,
                      borderColor: b.border,
                      color: b.color,
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={sectionLabel}>TOURNAMENT HISTORY</span>
              <div className="flex flex-col">
                {sel.tournaments.map((t) => (
                  <div
                    key={t.name + t.date}
                    className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="truncate text-[13px] font-extrabold text-white">
                        {t.name}
                      </span>
                      <span className="text-[11.5px] font-bold text-white/40">
                        {t.game} · {t.date}
                      </span>
                    </div>
                    <div
                      className="shrink-0 whitespace-nowrap rounded-full border px-[11px] py-1 text-[10.5px] font-extrabold"
                      style={{
                        background: t.bg,
                        borderColor: t.border,
                        color: t.color,
                      }}
                    >
                      {t.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
