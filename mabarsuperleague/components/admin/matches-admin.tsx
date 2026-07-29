"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { api, type Match, type Tournament } from "@/lib/admin/api";
import { RaceResultsAdmin } from "@/components/admin/race-results-admin";
import {
  btn,
  ErrorNote,
  Field,
  Modal,
  Select,
  StatusPill,
} from "@/components/admin/ui";

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

  const [open, setOpen] = useState(false);
  const [newMatch, setNewMatch] = useState({ teamA: "", teamB: "", round: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Results are only recorded for tournaments that are actually running.
        const ongoing = (await api.listTournaments()).filter(
          (t) => t.status === "ongoing",
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
        const m = await api.listMatches(selected);
        if (!active) return;
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

  async function removeMatch(m: Match) {
    if (!confirm(`Delete match ${m.teamA} vs ${m.teamB}?`)) return;
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
            Record results for tournaments that are currently ongoing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setOpen(true);
          }}
          disabled={!selected}
          className={`${btn.primary} ${isRacing ? "hidden" : ""}`}
        >
          <Plus className="mr-1.5 inline size-4 align-[-2px]" />
          Add match
        </button>
      </div>

      <ErrorNote message={error} />

      {!loading && tournaments.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
          No ongoing tournaments right now. Set a tournament&apos;s status to
          &ldquo;ongoing&rdquo; in{" "}
          <Link
            href="/admin/tournaments"
            className="font-extrabold text-[#FFB800] hover:underline"
          >
            Tournaments
          </Link>{" "}
          to record its results here.
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
                {m.teamA} <span className="text-white/30">vs</span> {m.teamB}
              </div>
            </div>
            <StatusPill status={m.status} />
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
          </div>
        ))}
      </div>
      )}
        </>
      )}

      {open && (
        <Modal title="Add match" onClose={() => setOpen(false)}>
          <form onSubmit={addMatch} className="flex flex-col gap-4">
            <Field
              label="ROUND (e.g. Semifinal)"
              value={newMatch.round}
              onChange={(e) =>
                setNewMatch((m) => ({ ...m, round: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="TEAM A"
                required
                value={newMatch.teamA}
                onChange={(e) =>
                  setNewMatch((m) => ({ ...m, teamA: e.target.value }))
                }
              />
              <Field
                label="TEAM B"
                required
                value={newMatch.teamB}
                onChange={(e) =>
                  setNewMatch((m) => ({ ...m, teamB: e.target.value }))
                }
              />
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
