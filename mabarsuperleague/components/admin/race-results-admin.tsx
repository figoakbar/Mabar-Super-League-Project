"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import {
  api,
  RACE_SESSIONS,
  type RaceResult,
  type RaceSession,
} from "@/lib/admin/api";
import { btn, ErrorNote } from "@/components/admin/ui";
import { LAP_TIME_HINT, normalizeLapTime } from "@/lib/tournaments/lap-time";

const sessionLabel: Record<RaceSession, string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  race: "Race",
};

type Draft = { position: string; lapTime: string };

/** Admin editor for racing-format tournaments: lap times + positions per session. */
export function RaceResultsAdmin({ tournamentId }: { tournamentId: string }) {
  const [session, setSession] = useState<RaceSession>("practice");
  const [rows, setRows] = useState<RaceResult[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmed participants: the only names a session can hold.
  const [entrants, setEntrants] = useState<string[]>([]);
  const [newDriver, setNewDriver] = useState("");
  const [adding, setAdding] = useState(false);

  /**
   * Show `list`. Rows being typed in keep their unsaved edits; only `fresh`
   * (the row just saved) and rows new to the list take the stored values.
   */
  function hydrate(list: RaceResult[], fresh?: string) {
    setRows(list);
    setDrafts((prev) =>
      Object.fromEntries(
        list.map((r) => [
          r.id,
          r.id !== fresh && prev[r.id]
            ? prev[r.id]
            : { position: r.position?.toString() ?? "", lapTime: r.lapTime },
        ]),
      ),
    );
  }

  async function load(fresh?: string) {
    try {
      hydrate(await api.listRaceResults(tournamentId), fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load results");
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, participants] = await Promise.all([
          api.listRaceResults(tournamentId),
          api.listParticipants(tournamentId),
        ]);
        if (!active) return;
        hydrate(list);
        setEntrants(
          participants.filter((p) => p.status === "confirmed").map((p) => p.team),
        );
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tournamentId]);

  const shown = rows.filter((r) => r.session === session);
  const inSession = new Set(shown.map((r) => r.driver));
  const missing = entrants.filter((t) => !inSession.has(t));

  async function save(r: RaceResult) {
    const d = drafts[r.id];
    setError(null);
    // Checked here too so a typo is caught before the round trip; the API has
    // the final say and stores the tidied form.
    if (normalizeLapTime(d?.lapTime ?? "") === null) {
      setError(`${r.driver}: ${LAP_TIME_HINT}`);
      return;
    }
    try {
      await api.updateRaceResult(r.id, {
        // An empty box clears the position: the driver is unclassified.
        position: d?.position ? Number(d.position) : null,
        lapTime: d?.lapTime ?? "",
      });
      await load(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function addAll() {
    setAdding(true);
    setError(null);
    try {
      await api.fillRaceResults(tournamentId, session);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!newDriver) return;
    setAdding(true);
    setError(null);
    try {
      await api.createRaceResult({
        tournamentId,
        session,
        driver: newDriver,
      });
      setNewDriver("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  async function remove(r: RaceResult) {
    if (!confirm(`Remove ${r.driver} from ${sessionLabel[r.session]}?`)) return;
    try {
      await api.deleteRaceResult(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const cell =
    "rounded-md border border-white/[0.14] bg-[#0A0B0D] px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-[#FFB800]/60";

  return (
    <div className="flex flex-col gap-4">
      <ErrorNote message={error} />

      {/* Session tabs */}
      <div className="flex gap-1 self-start rounded-lg border border-white/[0.08] bg-[#101114] p-1">
        {RACE_SESSIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSession(s)}
            className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-extrabold transition-colors"
            style={{
              background: session === s ? "#FFB800" : "transparent",
              color: session === s ? "#0A0B0D" : "rgba(255,255,255,0.55)",
            }}
          >
            {sessionLabel[s]}
          </button>
        ))}
      </div>

      {/* Add driver */}
      {/* Drivers come from the confirmed participants, so a typo can't send
          points to a name nobody holds. */}
      {missing.length > 0 ? (
        <form onSubmit={addDriver} className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addAll}
            disabled={adding}
            className={btn.primary}
          >
            <Users className="mr-1.5 inline size-4 align-[-2px]" />
            {adding
              ? "Adding…"
              : `Add all confirmed drivers (${missing.length})`}
          </button>
          <select
            aria-label={`Driver to add to ${sessionLabel[session]}`}
            value={newDriver}
            onChange={(e) => setNewDriver(e.target.value)}
            className="min-w-[220px] flex-1 rounded-lg border border-white/[0.12] bg-[#0A0B0D] px-3.5 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#FFB800]/60"
          >
            <option value="">Or add one driver to {sessionLabel[session]}…</option>
            {missing.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding || !newDriver}
            className={btn.ghost}
          >
            <Plus className="mr-1.5 inline size-4 align-[-2px]" />
            Add driver
          </button>
        </form>
      ) : (
        <p className="text-[12.5px] font-semibold text-white/45">
          {entrants.length === 0
            ? "No confirmed participants yet. Confirm entries in Registrations first."
            : `Every confirmed participant is in ${sessionLabel[session]}. Leave a position empty for a driver who didn't finish.`}
        </p>
      )}

      {/* Results table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114]">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
              <th className="px-5 py-3.5">Driver</th>
              <th className="px-5 py-3.5 w-28">Position</th>
              <th className="px-5 py-3.5 w-40">Lap time</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-white/40">
                  Loading…
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-white/40">
                  No {sessionLabel[session].toLowerCase()} results yet.
                </td>
              </tr>
            ) : (
              shown.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/[0.05] last:border-0"
                >
                  <td className="px-5 py-3 font-extrabold text-white">
                    {r.driver}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      aria-label={`${r.driver} position`}
                      inputMode="numeric"
                      value={drafts[r.id]?.position ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [r.id]: { ...d[r.id], position: e.target.value },
                        }))
                      }
                      className={`${cell} w-16 text-center`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      aria-label={`${r.driver} lap time`}
                      aria-invalid={normalizeLapTime(drafts[r.id]?.lapTime ?? "") === null}
                      title="1:32.451, or type the digits: 132451"
                      placeholder="1:32.451"
                      value={drafts[r.id]?.lapTime ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [r.id]: { ...d[r.id], lapTime: e.target.value },
                        }))
                      }
                      className={`${cell} w-32`}
                      style={
                        normalizeLapTime(drafts[r.id]?.lapTime ?? "") === null
                          ? { borderColor: "#E07A72" }
                          : undefined
                      }
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => save(r)}
                        className={btn.primary}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        aria-label="Remove driver"
                        className="cursor-pointer rounded-lg p-2 text-white/40 transition-colors hover:bg-[#E07A72]/10 hover:text-[#E07A72]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
