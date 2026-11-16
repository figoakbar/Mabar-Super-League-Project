"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronsRight, Plus, Trash2 } from "lucide-react";

import { api, type Match, type Tournament } from "@/lib/admin/api";
import { RaceResultsAdmin } from "@/components/admin/race-results-admin";
import {
  btn,
  ErrorNote,
  Modal,
  Select,
  StatusPill,
} from "@/components/admin/ui";

/**
 * The only round labels a match can have — season points and trophies are read
 * from them, so they come from a list rather than free text. Must match
 * KNOCKOUT_ROUNDS in backend/src/matches/rounds.ts.
 */
const KNOCKOUT_ROUNDS = [
  "Final",
  "Semifinals",
  "Quarterfinals",
  "Round of 16",
  "Round of 32",
  "Round of 64",
];
const GROUP_ROUNDS = ["A", "B", "C", "D", "E", "F", "G", "H"].map((g) => `Group ${g}`);

/** Players in a knockout round: "Final" → 2, "Semifinals" → 4, "Round of 16" → 16. */
function roundSize(round: string): number {
  if (round === "Final") return 2;
  if (round === "Semifinals") return 4;
  if (round === "Quarterfinals") return 8;
  const n = /^Round of (\d+)$/.exec(round);
  return n ? Number(n[1]) : 0;
}

/**
 * Whether the bracket is missing slots that "Build the rest of the bracket"
 * can add: a draw from before full brackets, or a deleted slot. Mirrors the
 * checks in MatchesService.buildBracket, so the button never appears just to be
 * refused.
 */
function bracketHasGaps(matches: Match[], format: string | undefined): boolean {
  const knockout = matches.filter((m) => roundSize(m.round) > 0);
  const groups = new Set(
    matches.filter((m) => m.round.startsWith("Group ")).map((m) => m.round),
  ).size;
  let first: number;
  if (format === "group_knockout" && knockout.length === 0) {
    // Only whole pairs of groups can be seated automatically: 1, 2, 4, 8 …
    if (groups === 0 || (groups & (groups - 1)) !== 0) return false;
    first = groups * 2;
  } else if (knockout.length === 0) {
    return false;
  } else {
    first = Math.max(...knockout.map((m) => roundSize(m.round)));
  }
  let gaps = false;
  for (let size = first; size >= 2; size /= 2) {
    const label =
      size === 2 ? "Final" : size === 4 ? "Semifinals" : size === 8 ? "Quarterfinals" : `Round of ${size}`;
    const count = matches.filter((m) => m.round === label).length;
    // An old knockout draw without its byes can't be completed — re-shuffle.
    if (size === first && format === "knockout" && count < size / 2) return false;
    if (count < size / 2) gaps = true;
  }
  return gaps;
}

export function MatchesAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // score entry drafts, keyed by match id
  const [drafts, setDrafts] = useState<Record<string, { a: string; b: string }>>(
    {},
  );

  // Confirmed players of the selected tournament, for the player pickers.
  const [players, setPlayers] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  // A bracket slot whose players are being set by hand.
  const [slot, setSlot] = useState<{ id: string; round: string; teamA: string; teamB: string } | null>(null);

  const [open, setOpen] = useState(false);
  const [newMatch, setNewMatch] = useState({ teamA: "", teamB: "", round: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Results are only recorded for running tournaments that already have a
        // draw. Racing has no draw, so it always qualifies; group/knockout must
        // be shuffled in the Drawing menu first.
        const ongoing = (await api.listTournaments()).filter(
          (t) =>
            t.status === "ongoing" &&
            (t.format === "racing" || t.matchCount > 0),
        );
        setTournaments(ongoing);
        if (ongoing.length) setSelected(ongoing[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadMatches(tid: string) {
    if (!tid) return;
    try {
      const m = await api.listMatches(tid);
      setMatches(m);
      setDrafts(
        Object.fromEntries(
          m.map((x) => [
            x.id,
            { a: x.scoreA?.toString() ?? "", b: x.scoreB?.toString() ?? "" },
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load matches");
    }
  }

  useEffect(() => {
    if (!selected) return;
    let active = true;
    (async () => {
      try {
        const [m, entrants] = await Promise.all([
          api.listMatches(selected),
          api.listParticipants(selected),
        ]);
        if (!active) return;
        setPlayers(
          entrants
            .filter((p) => p.status === "confirmed")
            .map((p) => p.team)
            .sort((a, b) => a.localeCompare(b)),
        );
        setMatches(m);
        setDrafts(
          Object.fromEntries(
            m.map((x) => [
              x.id,
              { a: x.scoreA?.toString() ?? "", b: x.scoreB?.toString() ?? "" },
            ]),
          ),
        );
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load matches");
      }
    })();
    return () => {
      active = false;
    };
  }, [selected]);

  async function saveScore(m: Match) {
    const d = drafts[m.id];
    const a = Number(d?.a);
    const b = Number(d?.b);
    if (d?.a === "" || d?.b === "" || Number.isNaN(a) || Number.isNaN(b)) {
      setError("Enter both scores before saving.");
      return;
    }
    // A new winner takes the old one's place in the next round, and any later
    // result the old winner played there no longer stands.
    if (
      m.status === "completed" &&
      m.scoreA != null &&
      m.scoreB != null &&
      Math.sign(a - b) !== Math.sign(m.scoreA - m.scoreB) &&
      !confirm(
        `This changes who won ${m.teamA} vs ${m.teamB}. The new winner takes the next-round place, and any later result there is cleared. Continue?`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await api.setScore(m.id, a, b);
      await loadMatches(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function addMatch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.createMatch({
        tournamentId: selected,
        teamA: newMatch.teamA.trim(),
        teamB: newMatch.teamB.trim(),
        round: newMatch.round,
      });
      setOpen(false);
      setNewMatch({ teamA: "", teamB: "", round: "" });
      await loadMatches(selected);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function buildBracket() {
    setBuilding(true);
    setError(null);
    try {
      await api.buildBracket(selected);
      await loadMatches(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the bracket");
    } finally {
      setBuilding(false);
    }
  }

  async function saveSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.updateMatch(slot.id, { teamA: slot.teamA, teamB: slot.teamB });
      setSlot(null);
      await loadMatches(selected);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeMatch(m: Match) {
    const label = m.status === "bye" ? `${m.teamA}'s bye` : `match ${m.teamA} vs ${m.teamB}`;
    if (!confirm(`Delete ${label}?`)) return;
    try {
      await api.deleteMatch(m.id);
      await loadMatches(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const selectedTournament = tournaments.find((t) => t.id === selected);
  const isRacing = selectedTournament?.format === "racing";

  const scoreInput =
    "w-14 rounded-md border border-white/[0.14] bg-[#0A0B0D] px-2 py-1.5 text-center text-sm font-extrabold text-white outline-none focus:border-[#FFB800]/60";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Matches &amp; Scores
          </h1>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Record results for ongoing tournaments once they have been drawn.
            Winners move into their next-round slot when you save a score.
          </p>
        </div>
        <div className={`flex flex-wrap gap-2 ${isRacing ? "hidden" : ""}`}>
          {/* Draws made before full brackets stop at their first round. */}
          {bracketHasGaps(matches, selectedTournament?.format) && (
            <button
              type="button"
              onClick={() => void buildBracket()}
              disabled={!selected || building}
              title="Add the missing rounds down to the Final and move winners forward"
              className={btn.ghost}
            >
              <ChevronsRight className="mr-1.5 inline size-4 align-[-2px]" />
              {building ? "Building…" : "Build the rest of the bracket"}
            </button>
          )}
          {/* A knockout bracket is complete from the draw. Group tournaments
              may still need a hand: a knockout for an odd number of groups,
              or a group match deleted by mistake. */}
          {selectedTournament?.format === "group_knockout" && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setOpen(true);
              }}
              disabled={!selected}
              className={btn.primary}
            >
              <Plus className="mr-1.5 inline size-4 align-[-2px]" />
              Add match
            </button>
          )}
        </div>
      </div>

      <ErrorNote message={error} />

      {!loading && tournaments.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
          No ongoing tournament has been drawn yet. Shuffle one in{" "}
          <Link
            href="/admin/drawing"
            className="font-extrabold text-[#FFB800] hover:underline"
          >
            Drawing
          </Link>{" "}
          first, then record its results here.
        </div>
      )}

      {(loading || tournaments.length > 0) && (
        <>
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

      {isRacing && selected ? (
        <RaceResultsAdmin tournamentId={selected} />
      ) : (
      <div className="flex flex-col gap-3">
        {!loading && matches.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
            No matches for this tournament yet.
          </div>
        )}
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-4"
          >
            <div className="min-w-[120px] flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
                {m.round || "Match"}
              </div>
              <div className="mt-0.5 font-extrabold text-white">
                {m.status === "bye" ? (
                  <>
                    {m.teamA}{" "}
                    <span className="text-white/30">goes straight through</span>
                  </>
                ) : !m.teamA || !m.teamB ? (
                  <>
                    {m.teamA || <span className="text-white/35">TBD</span>}{" "}
                    <span className="text-white/30">vs</span>{" "}
                    {m.teamB || <span className="text-white/35">TBD</span>}
                  </>
                ) : (
                  <>
                    {m.teamA} <span className="text-white/30">vs</span> {m.teamB}
                  </>
                )}
              </div>
            </div>
            <StatusPill status={m.status} />
            {m.status === "bye" ? (
              <button
                type="button"
                onClick={() => removeMatch(m)}
                aria-label="Delete bye"
                className="cursor-pointer rounded-lg p-2 text-white/40 transition-colors hover:bg-[#E07A72]/10 hover:text-[#E07A72]"
              >
                <Trash2 className="size-4" />
              </button>
            ) : !m.teamA || !m.teamB ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-white/35">
                  Waiting for the earlier round
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setSlot({ id: m.id, round: m.round, teamA: m.teamA, teamB: m.teamB });
                  }}
                  className={btn.chip}
                >
                  Set players
                </button>
              </div>
            ) : (
            <div className="flex items-center gap-2">
              <input
                aria-label={`${m.teamA} score`}
                className={scoreInput}
                inputMode="numeric"
                value={drafts[m.id]?.a ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({
                    ...d,
                    [m.id]: { ...d[m.id], a: e.target.value },
                  }))
                }
              />
              <span className="text-white/30">–</span>
              <input
                aria-label={`${m.teamB} score`}
                className={scoreInput}
                inputMode="numeric"
                value={drafts[m.id]?.b ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({
                    ...d,
                    [m.id]: { ...d[m.id], b: e.target.value },
                  }))
                }
              />
              <button
                type="button"
                onClick={() => saveScore(m)}
                className={btn.primary}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => removeMatch(m)}
                aria-label="Delete match"
                className="cursor-pointer rounded-lg p-2 text-white/40 transition-colors hover:bg-[#E07A72]/10 hover:text-[#E07A72]"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            )}
          </div>
        ))}
      </div>
      )}
        </>
      )}

      {slot && (
        <Modal title={`Set players — ${slot.round}`} onClose={() => setSlot(null)}>
          <form onSubmit={saveSlot} className="flex flex-col gap-4">
            <p className="text-[12.5px] font-semibold text-white/45">
              Winners fill these places on their own. Set them by hand only when
              the admins decide, for example a group tie head-to-head can&apos;t
              settle.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(["teamA", "teamB"] as const).map((side) => (
                <Select
                  key={side}
                  label={side === "teamA" ? "TEAM A" : "TEAM B"}
                  value={slot[side]}
                  onChange={(e) => setSlot((s) => s && { ...s, [side]: e.target.value })}
                >
                  <option value="">TBD</option>
                  {players.map((p) => (
                    <option
                      key={p}
                      value={p}
                      disabled={p === slot[side === "teamA" ? "teamB" : "teamA"]}
                    >
                      {p}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
            <ErrorNote message={formError} />
            <div className="mt-1 flex justify-end gap-3">
              <button type="button" onClick={() => setSlot(null)} className={btn.ghost}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btn.primary}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {open && (
        <Modal title="Add match" onClose={() => setOpen(false)}>
          <form onSubmit={addMatch} className="flex flex-col gap-4">
            <Select
              label="ROUND"
              required
              value={newMatch.round}
              onChange={(e) =>
                setNewMatch((m) => ({ ...m, round: e.target.value }))
              }
            >
              <option value="" disabled>
                Choose a round
              </option>
              <optgroup label="Knockout">
                {KNOCKOUT_ROUNDS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </optgroup>
              {tournaments.find((t) => t.id === selected)?.format ===
                "group_knockout" && (
                <optgroup label="Group stage">
                  {GROUP_ROUNDS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
            {/* Picked from the confirmed players, so a typo can't send a
                result (and its points) to the wrong name. */}
            <div className="grid grid-cols-2 gap-4">
              {(["teamA", "teamB"] as const).map((side) => (
                <Select
                  key={side}
                  label={side === "teamA" ? "TEAM A" : "TEAM B"}
                  required
                  value={newMatch[side]}
                  onChange={(e) =>
                    setNewMatch((m) => ({ ...m, [side]: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    Choose a player
                  </option>
                  {players.map((p) => (
                    <option
                      key={p}
                      value={p}
                      disabled={p === newMatch[side === "teamA" ? "teamB" : "teamA"]}
                    >
                      {p}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
            <ErrorNote message={formError} />
            <div className="mt-1 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={btn.ghost}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btn.primary}>
                {saving ? "Adding…" : "Add match"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
