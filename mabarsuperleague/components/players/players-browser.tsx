"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

import { API_ORIGIN, type PublicPlayer } from "@/lib/admin/api";
import { avatarBg, avatarSrc, initialsOf } from "@/lib/data/tournament-view";

type Chip = { bg: string; border: string; color: string };

const goldChip: Chip = { bg: "rgba(255,184,0,0.12)", border: "rgba(255,184,0,0.4)", color: "#FFB800" };
const silverChip: Chip = { bg: "rgba(199,206,220,0.1)", border: "rgba(199,206,220,0.35)", color: "#C7CEDC" };
const neutralChip: Chip = { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" };

const goldBadge: Chip = { bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.35)", color: "#FFB800" };
const neutralBadge: Chip = { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" };

/** Brand colour per game, used for accents, bars and avatars. */
const GAME_COLOR: Record<string, string> = {
  "EA FC": "#4FA3E0",
  "Grand Prix": "#4FBF8B",
  "Arcade Mania": "#E0A04F",
  "Fantasy League": "#8E7BFF",
  "Smash Court": "#E06055",
  "Turbo Ball": "#D9479A",
};
const gameColor = (g: string) => GAME_COLOR[g] ?? "#FFB800";

function resultChip(result: string): Chip {
  if (result === "Champion") return goldChip;
  if (result === "Runner-up") return silverChip;
  return neutralChip;
}

const sectionLabel = "text-xs font-extrabold tracking-[1px] text-white/40";

type PlayerRecord = { game: string; w: number; l: number; barW: string; color: string };
type PlayerView = {
  username: string;
  initials: string;
  avatarUrl: string;
  avatarBg: string;
  accent: string;
  memberSince: number;
  mainGame: string;
  wins: number;
  losses: number;
  trophies: number;
  winRate: number;
  points: number;
  isYou: boolean;
  records: PlayerRecord[];
  badges: (Chip & { label: string })[];
  tournaments: (Chip & { name: string; game: string; date: string; result: string })[];
};

/** Map the API's derived stats onto the presentation model (colours, bars…). */
function toView(p: PublicPlayer, isYou: boolean): PlayerView {
  const records: PlayerRecord[] = p.records.map((r) => {
    const total = r.w + r.l;
    return {
      game: r.game,
      w: r.w,
      l: r.l,
      barW: `${total ? Math.round((r.w / total) * 100) : 0}%`,
      color: gameColor(r.game),
    };
  });

  const played = p.wins + p.losses;
  // Career season points across every game the player has completed.
  const points = p.records.reduce((sum, r) => sum + r.points, 0);
  const badges =
    p.championships.length > 0
      ? p.championships.map((n) => ({
          label: `🏆 ${n.replace(/^MSL /, "")}`,
          ...goldBadge,
        }))
      : played > 0
        ? [{ label: `${played} matches played`, ...neutralBadge }]
        : [{ label: "New player", ...neutralBadge }];

  const tournaments = p.tournaments.map((t) => ({
    name: t.name,
    game: t.game,
    date: t.date,
    result: t.result,
    ...resultChip(t.result),
  }));

  return {
    username: p.username,
    initials: initialsOf(p.username),
    avatarUrl: p.avatarUrl,
    avatarBg: avatarBg(p.username),
    accent: gameColor(p.mainGame),
    memberSince: p.memberSince,
    mainGame: p.mainGame,
    wins: p.wins,
    losses: p.losses,
    trophies: p.trophies,
    winRate: p.winRate,
    points,
    isYou,
    records,
    badges,
    tournaments,
  };
}

/** Avatar tile: the uploaded picture when present, else a gradient + initials. */
function Avatar({
  view,
  size,
  radius,
  textCls,
}: {
  view: PlayerView;
  size: number;
  radius: number;
  textCls: string;
}) {
  const src = avatarSrc(view.avatarUrl, API_ORIGIN);
  // Sizing/clipping is done with inline styles, not Tailwind utilities, so a
  // stale CSS chunk can't drop `size-full`/`object-cover` and leave the photo
  // rendering at its natural aspect (which showed only the top half). The box
  // is a fixed square; flex-basis pins it inside the flex rows it lives in.
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </span>
    );
  }
  return (
    <span
      style={{
        ...box,
        display: "grid",
        placeItems: "center",
        background: view.avatarBg,
      }}
    >
      <span className={textCls}>{view.initials}</span>
    </span>
  );
}

/** The player's stats card — shared by the desktop side panel and mobile popup. */
function ProfileCard({ p }: { p: PlayerView }) {
  return (
    <>
      <div className="h-[3px]" style={{ background: p.accent }} />
      <div className="flex flex-col gap-[18px] p-[26px] pb-6">
        <div className="flex items-center gap-4">
          <Avatar
            view={p}
            size={68}
            radius={20}
            textCls="font-display text-2xl font-extrabold text-white"
          />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="truncate font-display text-2xl font-extrabold text-white">
              {p.username}
            </span>
            <span className="text-[12.5px] font-bold text-white/45">
              {p.mainGame ? `${p.mainGame} · ` : ""}Member since {p.memberSince}
            </span>
          </div>
        </div>

        <div className="flex border-y border-white/[0.08] py-3.5">
          {(
            [
              [p.wins, "WINS", "#6FCF97"],
              [p.losses, "LOSSES", "#E07A72"],
              [p.trophies, "TROPHIES", "#FFB800"],
              [`${p.winRate}%`, "WIN RATE", "#FFFFFF"],
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
          {p.records.length === 0 && (
            <span className="text-[13px] font-semibold text-white/40">
              No matches played yet.
            </span>
          )}
          {p.records.map((g) => (
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
            {p.badges.map((b) => (
              <div
                key={b.label}
                className="rounded-full border px-[13px] py-1.5 text-[11.5px] font-extrabold"
                style={{ background: b.bg, borderColor: b.border, color: b.color }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={sectionLabel}>TOURNAMENT HISTORY</span>
          {p.tournaments.length === 0 ? (
            <span className="text-[13px] font-semibold text-white/40">
              Not registered in any tournament yet.
            </span>
          ) : (
            <div className="flex flex-col">
              {p.tournaments.map((t) => (
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
                    style={{ background: t.bg, borderColor: t.border, color: t.color }}
                  >
                    {t.result}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function PlayersBrowser({
  players,
  currentUser,
}: {
  players: PublicPlayer[];
  currentUser: string | null;
}) {
  const views = useMemo(
    () => players.map((p) => toView(p, currentUser != null && p.username === currentUser)),
    [players, currentUser],
  );

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    () =>
      players.find((p) => p.username === currentUser)?.username ??
      players[0]?.username ??
      "",
  );
  // On mobile the profile opens as a popup; on desktop it's the side panel.
  const [mobileOpen, setMobileOpen] = useState(false);

  function openPlayer(name: string) {
    setSelected(name);
    // Only pop up on small screens — desktop keeps showing the side panel.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileOpen(true);
    }
  }

  // While the popup is open, lock background scroll and let Escape dismiss it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? views.filter((v) => v.username.toLowerCase().includes(q))
    : views;

  const sel = views.find((v) => v.username === selected) ?? shown[0] ?? views[0];

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
              {players.length} registered player{players.length === 1 ? "" : "s"} ·
              Search a username to view their profile
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
            const isSel = sel && p.username === sel.username;
            const played = p.wins + p.losses;
            return (
              <button
                key={p.username}
                type="button"
                onClick={() => openPlayer(p.username)}
                className="flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] border px-[18px] py-3.5 text-left transition hover:translate-x-1 hover:border-white/25"
                style={{
                  background: isSel ? "rgba(255,184,0,0.06)" : "#101114",
                  borderColor: isSel
                    ? "rgba(255,184,0,0.45)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <Avatar
                  view={p}
                  size={44}
                  radius={12}
                  textCls="font-display text-sm font-extrabold text-white"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-extrabold text-white">
                      {p.username}
                    </span>
                    {p.isYou && (
                      <span className="shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2 py-0.5 text-[9.5px] font-extrabold text-[#FFB800]">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs font-bold text-white/40">
                    <span className="font-extrabold text-[#FFB800]">
                      {p.points.toLocaleString("en-US")} pts
                    </span>
                    {played > 0 ? ` | ${p.wins}W · ${p.losses}L` : " | New player"}
                  </span>
                </div>
              </button>
            );
          })}

          {shown.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 rounded-[14px] border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center">
              <span className="font-display text-[17px] font-extrabold text-white">
                {players.length === 0 ? "No players yet" : "No players found"}
              </span>
              <span className="text-[13px] font-semibold text-white/45">
                {players.length === 0
                  ? "Players appear here once accounts are registered."
                  : "Try a different username or clear the search."}
              </span>
            </div>
          )}
        </div>

        {/* Profile panel — desktop side column. On mobile it's replaced by the popup. */}
        {sel && (
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#101114] lg:sticky lg:top-24 lg:block">
            <ProfileCard p={sel} />
          </div>
        )}
      </section>

      {/* Mobile: player detail as a popup instead of an inline panel below the list. */}
      {mobileOpen && sel && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center lg:hidden"
          onClick={() => setMobileOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close profile"
              className="absolute right-3 top-3 z-10 grid size-8 cursor-pointer place-items-center rounded-lg bg-black/50 text-white/70 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
            >
              <X className="size-4" />
            </button>
            <div className="max-h-[86vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-[#101114] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <ProfileCard p={sel} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
