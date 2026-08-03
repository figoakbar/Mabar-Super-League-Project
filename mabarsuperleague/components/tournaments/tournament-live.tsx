"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  api,
  RACE_SESSIONS,
  type Match,
  type Participant,
  type RaceResult,
  type Tournament,
  type TournamentDetail,
  type RaceSession,
} from "@/lib/admin/api";
import { accentFor } from "@/lib/data/tournament-view";

const PALETTE = [
  "linear-gradient(160deg, #8E7BFF, #5B3FD4)",
  "linear-gradient(160deg, #FFC24B, #F2803B)",
  "linear-gradient(160deg, #D9479A, #A32E72)",
  "linear-gradient(160deg, #4FBF8B, #2F8A5E)",
  "linear-gradient(160deg, #E06055, #A83A31)",
  "linear-gradient(160deg, #4FA3E0, #2B6FA8)",
  "linear-gradient(160deg, #7FE3FF, #2BA3E8)",
  "linear-gradient(160deg, #FF9BD2, #D9479A)",
];
const FALLBACK = "rgba(255,255,255,0.08)";

function avatarFor(name: string) {
  if (!name) return FALLBACK;
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

/** Round labels for a knockout bracket sized to the participant count. */
function knockoutRounds(playerCount: number): string[] {
  let size = 2;
  while (size < Math.max(playerCount, 2)) size *= 2;
  const rounds: string[] = [];
  while (size >= 2) {
    rounds.push(
      size === 2
        ? "Final"
        : size === 4
          ? "Semifinals"
          : size === 8
            ? "Quarterfinals"
            : `Round of ${size}`,
    );
    size /= 2;
  }
  return rounds;
}

type Seed = { a: string; b: string };

/**
 * Projected first knockout round for a group stage: the top two of each group
 * cross over (1st of one group vs 2nd of the next), so the bracket can be shown
 * before any group is decided. Groups are taken pairwise: A↔B, C↔D, …
 */
function groupSeedPairs(groupLabels: string[]): Seed[] {
  const letters = groupLabels
    .map((g) => g.replace(/group\s*/i, "").trim())
    .filter(Boolean);
  const pairs: Seed[] = [];
  for (let i = 0; i + 1 < letters.length; i += 2) {
    const g1 = letters[i];
    const g2 = letters[i + 1];
    pairs.push({ a: `1st · Group ${g1}`, b: `2nd · Group ${g2}` });
    pairs.push({ a: `1st · Group ${g2}`, b: `2nd · Group ${g1}` });
  }
  return pairs;
}

type Standing = { name: string; w: number; l: number; d: number; pts: number };

/** Group standings computed from completed matches (3 pts win, 1 draw). */
function standingsFor(matches: Match[]): Standing[] {
  const table = new Map<string, Standing>();
  const row = (n: string) => {
    if (!table.has(n)) table.set(n, { name: n, w: 0, l: 0, d: 0, pts: 0 });
    return table.get(n)!;
  };
  for (const m of matches) {
    const a = row(m.teamA);
    const b = row(m.teamB);
    if (m.status !== "completed" || m.scoreA == null || m.scoreB == null) continue;
    if (m.scoreA > m.scoreB) {
      a.w++;
      a.pts += 3;
      b.l++;
    } else if (m.scoreA < m.scoreB) {
      b.w++;
      b.pts += 3;
      a.l++;
    } else {
      a.d++;
      b.d++;
      a.pts++;
      b.pts++;
    }
  }
  return [...table.values()].sort(
    (x, y) => y.pts - x.pts || y.w - x.w || x.name.localeCompare(y.name),
  );
}

const sessionLabel: Record<RaceSession, string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  race: "Race",
};

const ROUND_ORDER = [
  "Group A", "Group B", "Group C", "Group D",
  "Round of 64", "Round of 32", "Round of 16",
  "Quarterfinals", "Semifinals", "Final", "Grand Final",
];

export function TournamentLive({
  t,
  username,
}: {
  t: Tournament;
  username: string;
}) {
  const accent = accentFor(t.game);
  const gameLabel = t.game.toUpperCase();
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"matches" | "bracket" | "participants">(
    "matches",
  );
  const [bracketView, setBracketView] = useState<"groups" | "ko">("groups");
  const [matchFilter, setMatchFilter] = useState("All");
  const [session, setSession] = useState<RaceSession>("race");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await api.getTournament(t.id);
        if (!active) return;
        setDetail(d);
        if (d.format === "racing") {
          setTab("bracket"); // racing has no match list — show Results first
          const rr = await api.listRaceResults(t.id);
          if (active) setRaceResults(rr);
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load tournament");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [t.id]);

  const isYou = (name: string) => name === username;
  const disp = (name: string) => name;
  const initialsOf = (name: string) => name.slice(0, 2).toUpperCase();

  const format = detail?.format ?? "group_knockout";
  const isRacing = format === "racing";
  const matches = detail?.matches ?? [];
  const participants: Participant[] = detail?.participants ?? [];
  const confirmed = participants.filter((p) => p.status === "confirmed");

  const win = "#6FCF97";
  const lose = "rgba(255,255,255,0.5)";
  const draw = "rgba(255,255,255,0.7)";

  // ---- match sections (grouped by round) ----
  const rounds = Array.from(new Set(matches.map((m) => m.round || "Matches")));
  rounds.sort((a, b) => {
    const ia = ROUND_ORDER.indexOf(a);
    const ib = ROUND_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  const filterChips = ["All", ...rounds];
  const sections = rounds
    .filter((r) => matchFilter === "All" || r === matchFilter)
    .map((round) => ({
      key: round,
      matches: matches
        .filter((m) => (m.round || "Matches") === round)
        .sort(
          (a, b) =>
            (a.status === "completed" ? 1 : 0) -
            (b.status === "completed" ? 1 : 0),
        ),
    }));

  // ---- bracket data ----
  const groupRounds = rounds.filter((r) => r.toLowerCase().startsWith("group"));
  // The knockout stage of a group tournament is sized to the qualifiers (top 2
  // of each group), not the whole field — 4 groups → 8 → Quarterfinals. A pure
  // knockout follows the confirmed count, falling back to the slot count so a
  // 64-slot cup still starts at "Round of 64" before teams are in.
  const koRounds =
    format === "group_knockout" && groupRounds.length > 0
      ? knockoutRounds(Math.max(2, groupRounds.length * 2))
      : knockoutRounds(
          confirmed.length || participants.length || detail?.maxTeams || 2,
        );

  // Before any knockout match exists we still project the first round from the
  // groups, so the reader can see who would meet whom once the groups finish.
  const knockoutStarted = matches.some((m) => koRounds.includes(m.round || ""));
  const seedPairs =
    format === "group_knockout" && groupRounds.length > 0 && !knockoutStarted
      ? groupSeedPairs(groupRounds)
      : [];

  const tabBtn = (key: typeof tab, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setTab(key)}
        className="border-b-[3px] px-4 py-3 font-display text-[15px] font-extrabold transition-colors sm:px-6"
        style={{
          borderColor: active ? "#FFB800" : "transparent",
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.45)",
        }}
      >
        {label}
      </button>
    );
  };

  const Avatar = ({ name, size = 30 }: { name: string; size?: number }) => (
    <span
      className="grid shrink-0 place-items-center rounded-lg font-display text-[10.5px] font-extrabold text-white"
      style={{ background: avatarFor(name), width: size, height: size }}
    >
      {initialsOf(name)}
    </span>
  );

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/[0.08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_30%,transparent_100%)]"
        />
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: accent }}
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-6 pt-8 sm:px-10">
          <Link
            href="/tournaments"
            className="text-[13px] font-extrabold text-white/45 transition-colors hover:text-white"
          >
            ← Back to tournaments
          </Link>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="text-[11px] font-extrabold tracking-[1.5px]"
                style={{ color: accent }}
              >
                {gameLabel} · ONLINE
              </span>
              <div className="flex items-center gap-1.5 rounded-full border border-[#E06055]/40 bg-[#E06055]/[0.14] px-2.5 py-1">
                <span className="size-1.5 rounded-full bg-[#E06055] [animation:pulse-soft_1.4s_ease-in-out_infinite]" />
                <span className="text-[10.5px] font-extrabold text-[#E06055]">
                  LIVE — {isRacing ? "RACE WEEKEND" : "IN PROGRESS"}
                </span>
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-[1.1] text-white sm:text-4xl">
              {t.name}
            </h1>
            <span className="text-sm font-semibold text-white/50">
              {confirmed.length || participants.length} participants ·{" "}
              {isRacing
                ? "Practice · Qualifying · Race"
                : format === "knockout"
                  ? `Single elimination — ${koRounds[0]} to Final`
                  : "Group stage · Top 2 advance to knockout"}
            </span>
          </div>

          <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!isRacing && tabBtn("matches", "Matches")}
            {tabBtn("bracket", isRacing ? "Results" : "Bracket")}
            {tabBtn("participants", "Participants")}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-6 pb-20 pt-8 sm:px-10">
        {error && (
          <div className="rounded-xl border border-[#E07A72]/30 bg-[#E07A72]/10 px-5 py-5 text-sm font-semibold text-[#E07A72]">
            {error}. Is the backend running?
          </div>
        )}

        {/* MATCHES */}
        {tab === "matches" && !isRacing && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-extrabold text-white">
                Matches
              </h2>
              <div className="flex flex-wrap gap-2">
                {filterChips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMatchFilter(c)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                      matchFilter === c
                        ? "border-[#FFB800] bg-[#FFB800] text-[#0A0B0D]"
                        : "border-white/[0.14] text-white/55 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <p className="-mt-1 text-[12.5px] font-semibold text-white/40">
              Scores are posted by admins after each match.
            </p>

            {loading ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
                Loading matches…
              </div>
            ) : sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
                No matches scheduled yet.
              </div>
            ) : (
              sections.map((sec) => (
                <div key={sec.key} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-base font-extrabold text-white">
                      {sec.key}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.07]" />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="min-w-[600px] px-[22px]">
                      {sec.matches.map((m) => {
                        const done =
                          m.status === "completed" &&
                          m.scoreA != null &&
                          m.scoreB != null;
                        const c1 = done
                          ? m.scoreA! > m.scoreB!
                            ? win
                            : m.scoreA! < m.scoreB!
                              ? lose
                              : draw
                          : "#FFFFFF";
                        const c2 = done
                          ? m.scoreB! > m.scoreA!
                            ? win
                            : m.scoreB! < m.scoreA!
                              ? lose
                              : draw
                          : "#FFFFFF";
                        return (
                          <div
                            key={m.id}
                            className="grid grid-cols-[104px_1fr_auto_1fr_120px] items-center gap-3.5 border-b border-white/[0.05] py-[13px] last:border-0"
                          >
                            {done ? (
                              <span className="w-fit rounded-md bg-white/[0.06] px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.8px] text-white/45">
                                FULL TIME
                              </span>
                            ) : (
                              <span className="w-fit rounded-md border border-[#6FCF97]/30 bg-[#6FCF97]/10 px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.8px] text-[#6FCF97]">
                                UPCOMING
                              </span>
                            )}

                            <div className="flex min-w-0 items-center justify-end gap-2.5">
                              <span
                                className="truncate text-right text-[13.5px] font-extrabold"
                                style={{ color: c1 }}
                              >
                                {disp(m.teamA)}
                              </span>
                              <Avatar name={m.teamA} />
                            </div>

                            <span
                              className="whitespace-nowrap rounded-md bg-black/35 px-3.5 py-1 font-display text-[13.5px] font-extrabold"
                              style={{
                                color: done ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                              }}
                            >
                              {done ? `${m.scoreA} – ${m.scoreB}` : "VS"}
                            </span>

                            <div className="flex min-w-0 items-center gap-2.5">
                              <Avatar name={m.teamB} />
                              <span
                                className="truncate text-[13.5px] font-extrabold"
                                style={{ color: c2 }}
                              >
                                {disp(m.teamB)}
                              </span>
                            </div>

                            <span className="text-right text-[11.5px] font-bold text-white/40">
                              {m.playedAt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Projected knockout round from the group standings */}
            {seedPairs.length > 0 && matchFilter === "All" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-base font-extrabold text-white">
                    {koRounds[0]}
                  </span>
                  <span className="rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.5px] text-[#FFB800]">
                    PROJECTED
                  </span>
                  <div className="h-px flex-1 bg-white/[0.07]" />
                </div>
                <div className="overflow-x-auto rounded-xl border border-dashed border-[#FFB800]/20 bg-[#FFB800]/[0.03] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="min-w-[600px] px-[22px]">
                    {seedPairs.map((p, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[104px_1fr_auto_1fr_120px] items-center gap-3.5 border-b border-white/[0.05] py-[13px] last:border-0"
                      >
                        <span className="w-fit rounded-md border border-[#FFB800]/30 bg-[#FFB800]/10 px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.8px] text-[#FFB800]">
                          PROJECTED
                        </span>
                        <span className="truncate text-right text-[13.5px] font-extrabold text-white/75">
                          {p.a}
                        </span>
                        <span className="whitespace-nowrap rounded-md bg-black/35 px-3.5 py-1 font-display text-[13.5px] font-extrabold text-white/45">
                          VS
                        </span>
                        <span className="truncate text-[13.5px] font-extrabold text-white/75">
                          {p.b}
                        </span>
                        <span className="text-right text-[11.5px] font-bold text-white/40">
                          After groups
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[11.5px] font-semibold text-white/35">
                  Top two of each group advance; the pairings lock once the group
                  stage finishes.
                </span>
              </div>
            )}
          </div>
        )}

        {/* BRACKET / RESULTS */}
        {tab === "bracket" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-extrabold text-white">
                {isRacing ? "Session Results" : "Bracket"}
              </h2>

              {isRacing ? (
                <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#101114] p-1">
                  {RACE_SESSIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSession(s)}
                      className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-extrabold transition-colors"
                      style={{
                        background: session === s ? "#FFB800" : "transparent",
                        color:
                          session === s ? "#0A0B0D" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {sessionLabel[s]}
                    </button>
                  ))}
                </div>
              ) : format === "group_knockout" ? (
                <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#101114] p-1">
                  {(["groups", "ko"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBracketView(b)}
                      className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-extrabold transition-colors"
                      style={{
                        background:
                          bracketView === b ? "#FFB800" : "transparent",
                        color:
                          bracketView === b
                            ? "#0A0B0D"
                            : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {b === "groups" ? "Group Stage" : "Knockout Stage"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* RACING — lap times per session */}
            {isRacing && (
              <>
                <p className="-mt-1 text-[12.5px] font-semibold text-white/40">
                  Lap times and positions are entered by admins after each
                  session.
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114]">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
                        <th className="w-20 px-5 py-3.5">Pos</th>
                        <th className="px-5 py-3.5">Driver</th>
                        <th className="px-5 py-3.5 text-right">Lap time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const list = raceResults
                          .filter((r) => r.session === session)
                          .sort(
                            (a, b) =>
                              (a.position ?? 999) - (b.position ?? 999),
                          );
                        if (loading)
                          return (
                            <tr>
                              <td colSpan={3} className="px-5 py-10 text-center text-white/40">
                                Loading…
                              </td>
                            </tr>
                          );
                        if (list.length === 0)
                          return (
                            <tr>
                              <td colSpan={3} className="px-5 py-10 text-center text-white/40">
                                No {sessionLabel[session].toLowerCase()} results
                                posted yet.
                              </td>
                            </tr>
                          );
                        return list.map((r) => {
                          const you = isYou(r.driver);
                          const podium = r.position != null && r.position <= 3;
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-white/[0.05] last:border-0"
                              style={{
                                background: you
                                  ? "rgba(255,184,0,0.06)"
                                  : undefined,
                              }}
                            >
                              <td className="px-5 py-3.5">
                                <span
                                  className="grid size-7 place-items-center rounded-md font-display text-[13px] font-extrabold"
                                  style={{
                                    background: podium
                                      ? "rgba(255,184,0,0.14)"
                                      : "rgba(255,255,255,0.06)",
                                    color: podium
                                      ? "#FFB800"
                                      : "rgba(255,255,255,0.55)",
                                  }}
                                >
                                  {r.position ?? "–"}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar name={r.driver} size={28} />
                                  <span
                                    className="text-sm font-extrabold"
                                    style={{ color: you ? "#FFB800" : "#FFFFFF" }}
                                  >
                                    {disp(r.driver)}
                                  </span>
                                  {you && (
                                    <span className="rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2 py-0.5 text-[9.5px] font-extrabold text-[#FFB800]">
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right font-display text-sm font-extrabold text-white">
                                {r.lapTime || "—"}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* GROUP STAGE — standings computed from played matches */}
            {!isRacing && format === "group_knockout" && bracketView === "groups" && (
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                {groupRounds.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40 sm:col-span-2">
                    No group matches yet.
                  </div>
                ) : (
                  groupRounds.map((g) => {
                    const table = standingsFor(
                      matches.filter((m) => (m.round || "") === g),
                    );
                    return (
                      <div
                        key={g}
                        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114]"
                      >
                        <div className="flex items-center justify-between border-b border-white/[0.08] px-[18px] py-3.5">
                          <span className="font-display text-base font-extrabold text-white">
                            {g}
                          </span>
                          <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                            W · L · PTS
                          </span>
                        </div>
                        {table.map((r, i) => {
                          const you = isYou(r.name);
                          return (
                            <div
                              key={r.name}
                              className="flex items-center gap-2 border-b border-white/[0.04] px-3.5 py-2.5 last:border-0"
                              style={{
                                background: you
                                  ? "rgba(255,184,0,0.07)"
                                  : "transparent",
                              }}
                            >
                              <span
                                className="w-3 font-display text-[13px] font-extrabold"
                                style={{
                                  color:
                                    i < 2 ? "#6FCF97" : "rgba(255,255,255,0.35)",
                                }}
                              >
                                {i + 1}
                              </span>
                              <Avatar name={r.name} size={26} />
                              <span
                                className="min-w-0 flex-1 truncate text-[13px] font-extrabold"
                                style={{ color: you ? "#FFB800" : "#FFFFFF" }}
                              >
                                {disp(r.name)}
                              </span>
                              <span className="w-11 text-right text-[12.5px] font-extrabold text-white/60">
                                {r.w}·{r.l}
                              </span>
                              <span className="w-6 text-right font-display text-sm font-extrabold text-white">
                                {r.pts}
                              </span>
                            </div>
                          );
                        })}
                        <div className="px-[18px] py-2.5 text-[10.5px] font-bold text-white/30">
                          Top 2 advance to the knockout stage
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* KNOCKOUT BRACKET — sized to the participant count */}
            {!isRacing &&
              (format === "knockout" || bracketView === "ko") && (
                <>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114] p-6">
                    <div
                      className="grid gap-5"
                      style={{
                        gridTemplateColumns: `repeat(${koRounds.length}, minmax(190px, 1fr))`,
                        minWidth: koRounds.length * 200,
                      }}
                    >
                      {koRounds.map((round) => {
                        const slots = matches.filter(
                          (m) => (m.round || "") === round,
                        );
                        const expected = Math.max(
                          1,
                          2 **
                            (koRounds.length - 1 - koRounds.indexOf(round)),
                        );
                        return (
                          <div key={round} className="flex flex-col gap-3.5">
                            <span
                              className="text-center text-[11px] font-extrabold tracking-[1.5px]"
                              style={{
                                color:
                                  round === "Final"
                                    ? "#FFB800"
                                    : "rgba(255,255,255,0.4)",
                              }}
                            >
                              {round.toUpperCase()}
                            </span>
                            {slots.length > 0
                              ? slots.map((m) => {
                                  const done =
                                    m.status === "completed" &&
                                    m.scoreA != null &&
                                    m.scoreB != null;
                                  return (
                                    <div
                                      key={m.id}
                                      className="overflow-hidden rounded-[10px] border border-white/[0.08] bg-black/30"
                                    >
                                      {[
                                        [m.teamA, m.scoreA, done && m.scoreA! > m.scoreB!],
                                        [m.teamB, m.scoreB, done && m.scoreB! > m.scoreA!],
                                      ].map(([name, score, isWinner], idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-3.5 py-2.5 last:border-0"
                                        >
                                          <span
                                            className="truncate text-[12.5px] font-extrabold"
                                            style={{
                                              color: isWinner
                                                ? win
                                                : done
                                                  ? lose
                                                  : "#FFFFFF",
                                            }}
                                          >
                                            {disp(String(name))}
                                          </span>
                                          <span className="text-[11px] font-extrabold text-white/50">
                                            {score ?? ""}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })
                              : koRounds.indexOf(round) === 0 &&
                                  seedPairs.length > 0
                                ? // Projected first round from the group standings.
                                  seedPairs.map((p, i) => (
                                    <div
                                      key={i}
                                      className="overflow-hidden rounded-[10px] border border-dashed border-[#FFB800]/25 bg-[#FFB800]/[0.04]"
                                    >
                                      <div className="border-b border-white/[0.05] px-3.5 py-2.5 text-[12px] font-extrabold text-white/70">
                                        {p.a}
                                      </div>
                                      <div className="px-3.5 py-2.5 text-[12px] font-extrabold text-white/70">
                                        {p.b}
                                      </div>
                                    </div>
                                  ))
                                : Array.from({ length: expected }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="overflow-hidden rounded-[10px] border border-dashed border-white/[0.14] bg-black/30"
                                    >
                                      <div className="border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-bold text-white/40">
                                        TBD
                                      </div>
                                      <div className="px-3.5 py-2.5 text-[12.5px] font-bold text-white/40">
                                        TBD
                                      </div>
                                    </div>
                                  ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white/35">
                    Bracket slots fill in as admins post results.
                  </span>
                </>
              )}
          </div>
        )}

        {/* PARTICIPANTS */}
        {tab === "participants" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[22px] font-extrabold text-white">
                Participants
              </h2>
              <span
                className="font-display text-lg font-extrabold"
                style={{ color: accent }}
              >
                {confirmed.length} {isRacing ? "drivers" : "players"}
              </span>
            </div>
            {loading ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
                Loading…
              </div>
            ) : confirmed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
                No confirmed participants yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {confirmed.map((p) => {
                  const you = isYou(p.team);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors hover:border-white/20"
                      style={{
                        background: you ? "rgba(255,184,0,0.06)" : "#101114",
                        borderColor: you
                          ? "rgba(255,184,0,0.4)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Avatar name={p.team} size={40} />
                      <div className="flex min-w-0 flex-col gap-px">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-extrabold text-white">
                            {disp(p.team)}
                          </span>
                          {you && (
                            <span className="shrink-0 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-2 py-0.5 text-[9.5px] font-extrabold text-[#FFB800]">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11.5px] font-bold text-white/40">
                          Confirmed participant
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
