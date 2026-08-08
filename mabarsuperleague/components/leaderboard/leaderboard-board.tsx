"use client";

import { useEffect, useState, type CSSProperties } from "react";

import {
  api,
  API_ORIGIN,
  type LeaderboardData,
  type LeaderboardEntry,
} from "@/lib/admin/api";
import { avatarBg, avatarSrc, initialsOf } from "@/lib/data/tournament-view";

type Medal = {
  medalBg: string;
  medalRing: string;
  medalColor: string;
  border: string;
  padBottom: number;
  delay: string;
};

const medals: Record<number, Medal> = {
  1: { medalBg: "rgba(255,184,0,0.15)", medalRing: "#FFB800", medalColor: "#FFB800", border: "rgba(255,184,0,0.45)", padBottom: 44, delay: "0s" },
  2: { medalBg: "rgba(199,206,220,0.15)", medalRing: "#AEB6C6", medalColor: "#C7CEDC", border: "rgba(199,206,220,0.25)", padBottom: 24, delay: "0.4s" },
  3: { medalBg: "rgba(217,142,82,0.15)", medalRing: "#C58350", medalColor: "#D98E52", border: "rgba(217,142,82,0.3)", padBottom: 16, delay: "0.8s" },
};

/** Small avatar: uploaded picture when present, else a gradient + initials. */
function LbAvatar({
  entry,
  size,
  radius,
  textCls,
}: {
  entry: LeaderboardEntry;
  size: number;
  radius: number;
  textCls: string;
}) {
  const src = avatarSrc(entry.avatarUrl, API_ORIGIN);
  const box: CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    borderRadius: radius,
    overflow: "hidden",
  };
  if (src) {
    return (
      <span style={{ ...box, display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
    );
  }
  return (
    <span
      style={{ ...box, display: "grid", placeItems: "center", background: avatarBg(entry.username) }}
    >
      <span className={textCls}>{initialsOf(entry.username)}</span>
    </span>
  );
}

export function LeaderboardBoard({ username }: { username: string }) {
  const [season, setSeason] = useState<string | undefined>(undefined);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .leaderboard(season)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setData({ season: season ?? "", seasons: [], players: [] });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [season]);

  const players = (data?.players ?? []).map((p, i) => ({ ...p, rank: i + 1 }));
  const seasons = data?.seasons ?? [];
  const activeSeason = data?.season ?? season ?? "";
  const hasPodium = players.length >= 3;
  const podium = hasPodium ? [players[1], players[0], players[2]] : [];
  const rows = hasPodium ? players.slice(3) : players;

  const isYou = (name: string) => name === username;

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
                Season <span className="text-[#FFB800]">Leaderboard</span>
              </h1>
              <span className="text-sm font-semibold text-white/50">
                Ranked by season points across all games · points reset each
                season
              </span>
            </div>
            {seasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => {
                  const active = s === activeSeason;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        setSeason(s);
                      }}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-[12.5px] font-extrabold transition-colors ${
                        active
                          ? "border-[#FFB800] bg-[#FFB800] text-[#0A0B0D]"
                          : "border-white/[0.14] bg-transparent text-white/55 hover:text-white"
                      }`}
                    >
                      Season {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top 3 — mobile list */}
          {hasPodium && (
            <div className="flex flex-col gap-3 pb-8 sm:hidden">
              {[players[0], players[1], players[2]].map((p, idx) => {
                const m = medals[idx + 1];
                return (
                  <div
                    key={p.username}
                    className="flex items-center gap-3 rounded-xl border bg-[#101114] px-4 py-3"
                    style={{ borderColor: m.border }}
                  >
                    <div
                      className="grid size-7 shrink-0 place-items-center rounded-full border-2 font-display text-xs font-extrabold"
                      style={{ background: m.medalBg, borderColor: m.medalRing, color: m.medalColor }}
                    >
                      {idx + 1}
                    </div>
                    <LbAvatar entry={p} size={40} radius={12} textCls="font-display text-sm font-extrabold text-white" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[15px] font-extrabold text-white">
                        {p.username}
                      </p>
                      <p className="truncate text-[11px] font-bold text-white/40">
                        {p.mainGame || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-display text-lg font-extrabold" style={{ color: m.medalColor }}>
                        {p.points.toLocaleString("en-US")}
                      </span>
                      <span className="text-[10px] font-extrabold text-white/40">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top 3 podium — desktop */}
          {hasPodium && (
            <div className="hidden grid-cols-3 items-end gap-[18px] sm:grid">
              {podium.map((p) => {
                const m = medals[p.rank];
                return (
                  <div
                    key={p.username}
                    className="relative flex flex-col items-center gap-2.5 rounded-t-[14px] border border-b-0 bg-[#101114] px-3 pt-6 text-center sm:px-[22px]"
                    style={{ borderColor: m.border, paddingBottom: m.padBottom }}
                  >
                    <div
                      className="absolute -top-4 left-1/2 -ml-4 grid size-8 place-items-center rounded-full border-2 font-display text-sm font-extrabold [animation:float_3s_ease-in-out_infinite]"
                      style={{ background: m.medalBg, borderColor: m.medalRing, color: m.medalColor, animationDelay: m.delay }}
                    >
                      {p.rank}
                    </div>
                    <LbAvatar entry={p} size={62} radius={18} textCls="font-display text-[22px] font-extrabold text-white" />
                    <div className="flex flex-col gap-px">
                      <span className="font-display text-lg font-extrabold text-white">
                        {p.username}
                      </span>
                      <span className="text-xs font-bold text-white/40">
                        {p.mainGame || "—"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-[5px]">
                      <span className="font-display text-[26px] font-extrabold" style={{ color: m.medalColor }}>
                        {p.points.toLocaleString("en-US")}
                      </span>
                      <span className="text-[11.5px] font-extrabold text-white/40">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-6 pb-20 pt-8 sm:px-10">
        {loading ? (
          <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
            Loading leaderboard…
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
            No season points yet
            {activeSeason ? ` for Season ${activeSeason}` : ""} — they appear
            once tournaments are completed.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/[0.08] bg-[#101114]">
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
                  key={r.username}
                  className="grid grid-cols-[34px_1fr_76px] items-center gap-2 border-b border-white/[0.05] px-4 py-[13px] transition-colors last:border-0 hover:bg-white/[0.03] md:grid-cols-[64px_1.6fr_1fr_90px_90px_110px] md:gap-3 md:px-6"
                  style={{ background: isYou(r.username) ? "rgba(255,184,0,0.05)" : undefined }}
                >
                  <span
                    className="font-display text-sm font-extrabold md:text-[15px]"
                    style={{ color: isYou(r.username) ? "#FFB800" : "rgba(255,255,255,0.6)" }}
                  >
                    {r.rank}
                  </span>

                  <div className="flex min-w-0 items-center gap-2 md:gap-3">
                    <LbAvatar entry={r} size={34} radius={10} textCls="font-display text-xs font-extrabold text-white" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-extrabold text-white">
                        {r.username}
                      </span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[11.5px] font-bold text-white/40">
                          {r.tournaments} tournament{r.tournaments === 1 ? "" : "s"}
                        </span>
                        {isYou(r.username) && (
                          <span className="shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-1.5 text-[9px] font-extrabold leading-4 text-[#FFB800] md:hidden">
                            YOU
                          </span>
                        )}
                      </span>
                    </div>
                    {isYou(r.username) && (
                      <div className="hidden shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2.5 py-[3px] text-[10.5px] font-extrabold text-[#FFB800] md:block">
                        YOU
                      </div>
                    )}
                  </div>

                  <span className="hidden text-[13px] font-extrabold text-white/55 md:block">
                    {r.mainGame || "—"}
                  </span>
                  <span className="hidden text-center text-sm font-extrabold text-[#6FCF97] md:block">
                    {r.wins}
                  </span>
                  <span className="hidden text-center text-sm font-extrabold text-[#E07A72] md:block">
                    {r.losses}
                  </span>
                  <span className="text-right font-display text-sm font-extrabold text-white md:text-base">
                    {r.points.toLocaleString("en-US")}
                  </span>
                </div>
              ))}
            </div>

            <span className="text-center text-[12.5px] font-bold text-white/35">
              {players.length} ranked player{players.length === 1 ? "" : "s"} ·
              points reset at the end of each season
            </span>
          </>
        )}
      </section>
    </>
  );
}
