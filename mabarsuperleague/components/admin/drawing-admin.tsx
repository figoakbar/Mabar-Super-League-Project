"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Shuffle } from "lucide-react";

import { api, type Match, type Tournament } from "@/lib/admin/api";
import { ErrorNote, Select } from "@/components/admin/ui";
import { avatarBg } from "@/lib/data/tournament-view";

type Group = { label: string; players: string[] };

/** Rebuild the group → players map from the generated group matches. */
function deriveGroups(matches: Match[]): Group[] {
  const map = new Map<string, Set<string>>();
  for (const m of matches) {
    if (!/^group/i.test(m.round || "")) continue;
    if (!map.has(m.round)) map.set(m.round, new Set());
    map.get(m.round)!.add(m.teamA);
    map.get(m.round)!.add(m.teamB);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, players]) => ({ label, players: [...players].sort() }));
}

/** Matches belonging to one group, in creation order. */
function groupMatches(matches: Match[], label: string): Match[] {
  return matches.filter((m) => m.round === label);
}

function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[7px] font-display text-[10px] font-extrabold text-white"
      style={{ background: avatarBg(name), width: size, height: size }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function DrawingAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);
  // Only animate the reveal right after a shuffle, not when opening an existing draw.
  const [animate, setAnimate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Drawing happens once registration is closed, for bracket tournaments
        // only (racing has no draw).
        const list = (await api.listTournaments()).filter(
          (t) => t.status === "closed" && t.format !== "racing",
        );
        if (!active) return;
        setTournaments(list);
        if (list.length) setSelected(list[0].id);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    (async () => {
      try {
        const m = await api.listMatches(selected);
        if (!active) return;
        // Opening an existing draw shows it at rest, no entrance animation.
        setAnimate(false);
        setMatches(m);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load draw");
      }
    })();
    return () => {
      active = false;
    };
  }, [selected]);

  const tournament = tournaments.find((t) => t.id === selected);
  const isGroup = tournament?.format === "group_knockout";
  const drawn = matches.length > 0;
  const groups = useMemo(() => deriveGroups(matches), [matches]);

  async function runShuffle(isReshuffle: boolean) {
    if (!selected) return;
    if (
      isReshuffle &&
      !confirm(
        "Re-shuffle the draw? This replaces the current groups / bracket and any scores already entered.",
      )
    ) {
      return;
    }
    setShuffling(true);
    setError(null);
    try {
      const created = await api.generateDraw(selected);
      setMatches(created);
      setAnimate(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draw the tournament");
    } finally {
      setShuffling(false);
    }
  }

  // Staggered entrance delays (seconds). Groups reveal one after another, their
  // players trickle in, then the matches appear once the groups are set.
  const GROUP_GAP = 0.5;
  const groupDelay = (i: number) => (animate ? `${i * GROUP_GAP}s` : "0s");
  const playerDelay = (gi: number, pi: number) =>
    animate ? `${gi * GROUP_GAP + 0.12 + pi * 0.08}s` : "0s";
  const matchesDelay = animate ? `${groups.length * GROUP_GAP + 0.35}s` : "0s";
  const pairDelay = (i: number) => (animate ? `${i * 0.35}s` : "0s");
  const cls = animate ? "draw-in" : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Reveal animation lives here (component-scoped) so it can't be lost to a
          stale global stylesheet. Opacity + a small lift; no sticky ancestors. */}
      <style
        href="drawing-reveal"
        precedence="default"
      >{`
        @keyframes draw-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .draw-in { animation: draw-in 380ms ease-out both; }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Drawing
          </h1>
          <p className="mt-1 max-w-[560px] text-sm font-semibold text-white/45">
            Shuffle the confirmed players into the groups or bracket. Once a
            tournament is drawn it appears in{" "}
            <Link
              href="/admin/matches"
              className="font-extrabold text-[#FFB800] hover:underline"
            >
              Matches &amp; Scores
            </Link>{" "}
            for scoring.
          </p>
        </div>
        {drawn && !shuffling && (
          <button
            type="button"
            onClick={() => void runShuffle(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.14] px-3 py-2 font-display text-xs font-extrabold text-white/60 transition-colors hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Re-shuffle
          </button>
        )}
      </div>

      <ErrorNote message={error} />

      {!loading && tournaments.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
          No tournament is ready to draw. Set a group or knockout tournament to{" "}
          <span className="font-extrabold text-white/70">closed</span>{" "}
          (registration closed) in{" "}
          <Link
            href="/admin/tournaments"
            className="font-extrabold text-[#FFB800] hover:underline"
          >
            Tournaments
          </Link>{" "}
          once registration ends.
        </div>
      )}

      {(loading || tournaments.length > 0) && (
        <div className="w-full sm:w-80">
          {loading ? (
            <span className="text-sm text-white/40">Loading…</span>
          ) : (
            <Select
              label="TOURNAMENT"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* Initial state: nothing but the shuffle button. */}
      {selected && !drawn && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/[0.12] bg-[#101114] px-6 py-16">
          <p className="text-center text-sm font-semibold text-white/45">
            {isGroup
              ? `${tournament?.registeredTeams ?? 0} confirmed players will be split into groups, each playing a round-robin.`
              : `${tournament?.registeredTeams ?? 0} confirmed players will be paired into a knockout bracket.`}
          </p>
          <button
            type="button"
            onClick={() => void runShuffle(false)}
            disabled={shuffling}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#6FCF97] px-7 py-3.5 font-display text-base font-extrabold text-[#08130C] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Shuffle className="size-5" />
            {shuffling ? "Shuffling…" : "Shuffle Players to Ladder / Bracket"}
          </button>
        </div>
      )}

      {/* Drawn: groups (with players) then matches, or the knockout bracket. */}
      {selected && drawn && isGroup && (
        <div className="flex flex-col gap-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {groups.map((g, gi) => (
              <div
                key={g.label}
                className={`flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114] ${cls}`}
                style={{ animationDelay: groupDelay(gi) }}
              >
                <div className="border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <span className="font-display text-sm font-extrabold text-[#FFB800]">
                    {g.label}
                  </span>
                </div>
                <div className="flex flex-col">
                  {g.players.map((p, pi) => (
                    <div
                      key={p}
                      className={`flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-2.5 last:border-0 ${cls}`}
                      style={{ animationDelay: playerDelay(gi, pi) }}
                    >
                      <Avatar name={p} />
                      <span className="truncate text-[13px] font-extrabold text-white">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className={`flex flex-col gap-4 ${cls}`}
            style={{ animationDelay: matchesDelay }}
          >
            <h2 className="font-display text-lg font-extrabold text-white">
              Group matches
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {groups.map((g) => (
                <div
                  key={g.label}
                  className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114]"
                >
                  <div className="border-b border-white/[0.08] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
                    {g.label}
                  </div>
                  <div className="flex flex-col px-4">
                    {groupMatches(matches, g.label).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-center gap-3 border-b border-white/[0.05] py-2.5 text-[13px] font-extrabold text-white last:border-0"
                      >
                        <span className="min-w-0 flex-1 truncate text-right">
                          {m.teamA}
                        </span>
                        <span className="text-[11px] font-bold text-white/30">
                          vs
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {m.teamB}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && drawn && !isGroup && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-extrabold text-white">
            First-round bracket
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {matches.map((m, i) => (
              <div
                key={m.id}
                className={`overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114] ${cls}`}
                style={{ animationDelay: pairDelay(i) }}
              >
                <div className="border-b border-white/[0.06] px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[1px] text-white/35">
                  {m.round || "Match"}
                </div>
                {[m.teamA, m.teamB].map((name, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 border-b border-white/[0.05] px-4 py-3 last:border-0"
                  >
                    <Avatar name={name} />
                    <span className="truncate text-[13.5px] font-extrabold text-white">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
