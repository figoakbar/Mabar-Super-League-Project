"use client";

import { useState } from "react";

const cats = [
  "EA FC",
  "Fantasy League",
  "Grand Prix",
  "Smash Court",
  "Arcade Mania",
  "Turbo Ball",
];

type PoolPlayer = {
  name: string;
  initials: string;
  sub: string;
  avatarBg: string;
  isYou?: boolean;
};

const pool: PoolPlayer[] = [
  { name: "GoalMachine", initials: "GM", sub: "Bandung, ID", avatarBg: "linear-gradient(160deg, #8E7BFF, #5B3FD4)" },
  { name: "SpeedKing_ID", initials: "SK", sub: "Jakarta, ID", avatarBg: "linear-gradient(160deg, #FFC24B, #F2803B)" },
  { name: "PixelQueen", initials: "PQ", sub: "Bali, ID", avatarBg: "linear-gradient(160deg, #D9479A, #A32E72)" },
  { name: "CaptainStrike", initials: "CS", sub: "Jakarta, ID", avatarBg: "linear-gradient(160deg, #4FBF8B, #2F8A5E)" },
  { name: "AceHunter", initials: "AH", sub: "Bandung, ID", avatarBg: "linear-gradient(160deg, #E06055, #A83A31)" },
  { name: "DimasFC_99", initials: "DM", sub: "Surabaya, ID", avatarBg: "linear-gradient(160deg, #4FA3E0, #2B6FA8)" },
  { name: "NitroNina", initials: "NN", sub: "Medan, ID", avatarBg: "linear-gradient(160deg, #7FE3FF, #2BA3E8)" },
  { name: "RizkyPratama", initials: "RZ", sub: "Jakarta, ID", avatarBg: "linear-gradient(160deg, #8E7BFF, #5B3FD4)", isYou: true },
  { name: "ShadowVolt", initials: "SV", sub: "Bali, ID", avatarBg: "linear-gradient(160deg, #2E2A45, #1C1926)" },
  { name: "TurboTiger", initials: "TT", sub: "Semarang, ID", avatarBg: "linear-gradient(160deg, #FF9BD2, #D9479A)" },
];

const medals: Record<
  number,
  {
    medalBg: string;
    medalRing: string;
    medalColor: string;
    border: string;
    padBottom: number;
    delay: string;
  }
> = {
  1: { medalBg: "rgba(255,184,0,0.15)", medalRing: "#FFB800", medalColor: "#FFB800", border: "rgba(255,184,0,0.45)", padBottom: 44, delay: "0s" },
  2: { medalBg: "rgba(199,206,220,0.15)", medalRing: "#AEB6C6", medalColor: "#C7CEDC", border: "rgba(199,206,220,0.25)", padBottom: 24, delay: "0.4s" },
  3: { medalBg: "rgba(217,142,82,0.15)", medalRing: "#C58350", medalColor: "#D98E52", border: "rgba(217,142,82,0.3)", padBottom: 16, delay: "0.8s" },
};

const trends = [
  { trend: "▲", trendColor: "#6FCF97" },
  { trend: "—", trendColor: "rgba(255,255,255,0.25)" },
  { trend: "▼", trendColor: "#E07A72" },
];

export function LeaderboardBoard({ username }: { username: string }) {
  const [filter, setFilter] = useState("EA FC");

  const players = pool.map((p) =>
    p.isYou
      ? { ...p, name: username, initials: username.slice(0, 2).toUpperCase() }
      : p,
  );

  const gi = Math.max(0, cats.indexOf(filter));
  const shift = gi % players.length;
  const ordered = players.slice(shift).concat(players.slice(0, shift));
  const ranked = ordered.map((p, i) => ({
    ...p,
    rankN: i + 1,
    ptsN: 2875 - i * 148 - gi * 19,
    w: 58 - i * 4,
    l: 15 + i * 2,
  }));

  const podium = [2, 1, 3].map((n) => ({
    ...ranked[n - 1],
    ...medals[n],
    rank: n,
  }));

  const rows = ranked.slice(3).map((r, i) => ({
    ...r,
    ...trends[(i + gi) % 3],
  }));

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/[0.08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_30%,transparent_100%)]"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-6 pt-11 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-3xl font-extrabold leading-[1.1] text-white sm:text-[40px]">
                Season 5 <span className="text-[#FFB800]">Leaderboard</span>
              </h1>
              <span className="text-sm font-semibold text-white/50">
                Top 100 players per game · Season points · Updated 1h ago
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => {
                const active = filter === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilter(c)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-[12.5px] font-extrabold transition-colors ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800] text-[#0A0B0D]"
                        : "border-white/[0.14] bg-transparent text-white/55 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top 3 — mobile list */}
          <div className="flex flex-col gap-3 pb-8 sm:hidden">
            {[1, 2, 3].map((n) => {
              const p = { ...ranked[n - 1], ...medals[n] };
              return (
                <div
                  key={n}
                  className="flex items-center gap-3 rounded-xl border bg-[#101114] px-4 py-3"
                  style={{ borderColor: p.border }}
                >
                  <div
                    className="grid size-7 shrink-0 place-items-center rounded-full border-2 font-display text-xs font-extrabold"
                    style={{
                      background: p.medalBg,
                      borderColor: p.medalRing,
                      color: p.medalColor,
                    }}
                  >
                    {n}
                  </div>
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: p.avatarBg }}
                  >
                    <span className="font-display text-sm font-extrabold text-white">
                      {p.initials}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-extrabold text-white">
                      {p.name}
                    </p>
                    <p className="truncate text-[11px] font-bold text-white/40">
                      {p.sub}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1">
                    <span
                      className="font-display text-lg font-extrabold"
                      style={{ color: p.medalColor }}
                    >
                      {p.ptsN.toLocaleString("en-US")}
                    </span>
                    <span className="text-[10px] font-extrabold text-white/40">
                      PTS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top 3 podium — desktop */}
          <div className="hidden grid-cols-3 items-end gap-[18px] sm:grid">
            {podium.map((p) => (
              <div
                key={p.rank}
                className="relative flex flex-col items-center gap-2.5 rounded-t-[14px] border border-b-0 bg-[#101114] px-3 pt-6 text-center sm:px-[22px]"
                style={{
                  borderColor: p.border,
                  paddingBottom: p.padBottom,
                }}
              >
                <div
                  className="absolute -top-4 left-1/2 -ml-4 grid size-8 place-items-center rounded-full border-2 font-display text-sm font-extrabold [animation:float_3s_ease-in-out_infinite]"
                  style={{
                    background: p.medalBg,
                    borderColor: p.medalRing,
                    color: p.medalColor,
                    animationDelay: p.delay,
                  }}
                >
                  {p.rank}
                </div>
                <div
                  className="mt-2 grid size-[62px] place-items-center rounded-[18px]"
                  style={{ background: p.avatarBg }}
                >
                  <span className="font-display text-[22px] font-extrabold text-white">
                    {p.initials}
                  </span>
                </div>
                <div className="flex flex-col gap-px">
                  <span className="font-display text-lg font-extrabold text-white">
                    {p.name}
                  </span>
                  <span className="text-xs font-bold text-white/40">
                    {p.sub}
                  </span>
                </div>
                <div className="flex items-baseline gap-[5px]">
                  <span
                    className="font-display text-[26px] font-extrabold"
                    style={{ color: p.medalColor }}
                  >
                    {p.ptsN.toLocaleString("en-US")}
                  </span>
                  <span className="text-[11.5px] font-extrabold text-white/40">
                    PTS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-6 pb-20 pt-8 sm:px-10">
        <div className="rounded-xl border border-white/[0.08] bg-[#101114]">
          <div>
            <div className="grid grid-cols-[34px_1fr_76px] items-center gap-2 border-b border-white/[0.08] px-4 py-3.5 text-[10px] font-extrabold tracking-[1px] text-white/40 md:grid-cols-[64px_1.6fr_1fr_90px_90px_110px] md:gap-3 md:px-6 md:text-[11px]">
              <span>RANK</span>
              <span>PLAYER</span>
              <span className="hidden md:block">GAME</span>
              <span className="hidden text-center md:block">W</span>
              <span className="hidden text-center md:block">L</span>
              <span className="text-right">POINTS</span>
            </div>

            {rows.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[34px_1fr_76px] items-center gap-2 border-b border-white/[0.05] px-4 py-[13px] transition-colors hover:bg-white/[0.03] md:grid-cols-[64px_1.6fr_1fr_90px_90px_110px] md:gap-3 md:px-6"
                style={{
                  background: r.isYou ? "rgba(255,184,0,0.05)" : undefined,
                }}
              >
                <div className="flex items-center gap-1 md:gap-2">
                  <span
                    className="font-display text-sm font-extrabold md:text-[15px]"
                    style={{
                      color: r.isYou ? "#FFB800" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {r.rankN}
                  </span>
                  <span
                    className="text-[11px] font-extrabold"
                    style={{ color: r.trendColor }}
                  >
                    {r.trend}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <div
                    className="grid size-[30px] shrink-0 place-items-center rounded-[10px] font-display text-xs font-extrabold text-white md:size-[34px]"
                    style={{ background: r.avatarBg }}
                  >
                    {r.initials}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-extrabold text-white">
                      {r.name}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[11.5px] font-bold text-white/40">
                        {r.sub}
                      </span>
                      {r.isYou && (
                        <span className="shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-1.5 text-[9px] font-extrabold leading-4 text-[#FFB800] md:hidden">
                          YOU
                        </span>
                      )}
                    </span>
                  </div>
                  {r.isYou && (
                    <div className="hidden shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2.5 py-[3px] text-[10.5px] font-extrabold text-[#FFB800] md:block">
                      YOU
                    </div>
                  )}
                </div>

                <span className="hidden text-[13px] font-extrabold text-white/55 md:block">
                  {filter}
                </span>
                <span className="hidden text-center text-sm font-extrabold text-[#6FCF97] md:block">
                  {r.w}
                </span>
                <span className="hidden text-center text-sm font-extrabold text-[#E07A72] md:block">
                  {r.l}
                </span>
                <span className="text-right font-display text-sm font-extrabold text-white md:text-base">
                  {r.ptsN.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <span className="text-center text-[12.5px] font-bold text-white/35">
          Showing top 10 of 100 · Points reset at the end of each season
        </span>
      </section>
    </>
  );
}
