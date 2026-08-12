"use client";

import { useEffect, useState } from "react";
import {
  CalendarPlus,
  CalendarRange,
  Flag,
  Pencil,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";

import { api, type Season, type SeasonStatus } from "@/lib/admin/api";
import { btn, ErrorNote, Field } from "@/components/admin/ui";
import { formatDate } from "@/lib/data/tournament-view";

/** ISO timestamp → yyyy-mm-dd for a <input type="date">. */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

const STATUS_CHIP: Record<SeasonStatus, { label: string; cls: string }> = {
  active: { label: "ACTIVE", cls: "bg-[#6FCF97]/15 text-[#6FCF97]" },
  upcoming: { label: "UPCOMING", cls: "bg-[#4FA3E0]/15 text-[#4FA3E0]" },
  closed: { label: "CLOSED", cls: "bg-white/[0.08] text-white/45" },
};

type Draft = { name: string; startAt: string; endAt: string };

/** Schedule, edit, and close competitive seasons; view each season's champions. */
export function SeasonsAdmin() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // New-season form.
  const [form, setForm] = useState<Draft>({ name: "", startAt: "", endAt: "" });
  // Which season is being edited inline, plus its draft.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ name: "", startAt: "", endAt: "" });

  async function load() {
    setError(null);
    try {
      setSeasons(await api.listSeasons());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load seasons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.listSeasons();
        if (alive) setSeasons(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const active = seasons.find((s) => s.status === "active");
  const upcoming = seasons.filter((s) => s.status === "upcoming");
  const closed = seasons.filter((s) => s.status === "closed");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function schedule() {
    const startsNow = !form.startAt || form.startAt <= new Date().toISOString().slice(0, 10);
    if (
      active &&
      startsNow &&
      !confirm(
        `Start ${form.name.trim() ? `"${form.name.trim()}"` : "a new season"} now? This closes "${active.name}" and freezes its champions.`,
      )
    )
      return;
    void run(async () => {
      await api.scheduleSeason({
        name: form.name.trim() || undefined,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      });
      setForm({ name: "", startAt: "", endAt: "" });
    });
  }

  function beginEdit(s: Season) {
    setEditingId(s.id);
    setEditDraft({
      name: s.name,
      startAt: toDateInput(s.startedAt),
      endAt: toDateInput(s.endedAt),
    });
  }

  function saveEdit(s: Season) {
    void run(async () => {
      await api.updateSeason(s.id, {
        name: editDraft.name.trim() || undefined,
        startAt: editDraft.startAt || undefined,
        // Empty end date clears it (open-ended).
        endAt: editDraft.endAt || null,
      });
      setEditingId(null);
    });
  }

  function closeSeason(s: Season) {
    if (
      !confirm(
        `Close "${s.name}" now? It freezes the champions and leaves no active season until you start a new one.`,
      )
    )
      return;
    void run(() => api.closeSeason(s.id));
  }

  const inputCls =
    "w-full rounded-lg border border-white/[0.12] bg-[#0A0B0D] px-3.5 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFB800]/60";

  function editForm(s: Season) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-white/[0.1] bg-[#0A0B0D] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field
            label="NAME"
            value={editDraft.name}
            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Field
            label="START DATE"
            type="date"
            value={editDraft.startAt}
            onChange={(e) => setEditDraft((d) => ({ ...d, startAt: e.target.value }))}
          />
          <Field
            label="END DATE (BLANK = OPEN)"
            type="date"
            value={editDraft.endAt}
            onChange={(e) => setEditDraft((d) => ({ ...d, endAt: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => saveEdit(s)}
            disabled={busy}
            className={btn.primary}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            disabled={busy}
            className={`${btn.ghost} flex items-center gap-1.5`}
          >
            <X className="size-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  function windowText(s: Season) {
    return `${formatDate(s.startedAt)} → ${s.endedAt ? formatDate(s.endedAt) : "open-ended"}`;
  }

  function seasonRow(s: Season, tone: string) {
    const chip = STATUS_CHIP[s.status];
    const overall = s.champions.find((c) => c.game === "");
    const perGame = s.champions.filter((c) => c.game !== "");
    return (
      <div key={s.id} className={`flex flex-col gap-3 rounded-xl border p-5 ${tone}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-[0.5px] ${chip.cls}`}>
                {chip.label}
              </span>
              <span className="font-display text-[17px] font-extrabold text-white">
                {s.name}
              </span>
            </div>
            <span className="text-[12px] font-semibold text-white/45">
              {windowText(s)} · {s._count.tournaments} tournament
              {s._count.tournaments === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => beginEdit(s)}
              disabled={busy}
              className={`${btn.chip} flex items-center gap-1.5`}
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            {s.status === "closed" && (
              <button
                type="button"
                onClick={() => void run(() => api.recomputeSeasonChampions(s.id))}
                disabled={busy}
                className={`${btn.chip} flex items-center gap-1.5`}
                title="Refresh champions from this season's results"
              >
                <RefreshCw className="size-3.5" /> Recompute
              </button>
            )}
            {s.status === "active" && (
              <button
                type="button"
                onClick={() => closeSeason(s)}
                disabled={busy}
                className={`${btn.danger} flex items-center gap-1.5`}
              >
                <Flag className="size-3.5" /> Close now
              </button>
            )}
          </div>
        </div>

        {s.status === "closed" &&
          (s.champions.length === 0 ? (
            <span className="text-[12.5px] font-semibold text-white/35">
              No champions recorded.
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {overall && (
                <span className="flex items-center gap-1.5 rounded-lg border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-3 py-1.5 text-[12.5px] font-extrabold text-white">
                  <Trophy className="size-3.5 text-[#FFB800]" />
                  Overall · <span className="text-[#FFB800]">{overall.username}</span>
                  <span className="font-bold text-white/45">
                    {overall.points.toLocaleString("en-US")} pts
                  </span>
                </span>
              )}
              {perGame.map((c) => (
                <span
                  key={c.id}
                  className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[12px] font-bold text-white/70"
                >
                  {c.game} · <span className="font-extrabold text-white">{c.username}</span>
                </span>
              ))}
            </div>
          ))}

        {editingId === s.id && editForm(s)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-extrabold text-white">Seasons</h1>
        <p className="text-[13.5px] font-semibold text-white/50">
          Schedule seasons with start and end dates — they activate and close
          automatically on those dates (closing freezes the champions). New
          tournaments join the active season.
        </p>
      </div>

      <ErrorNote message={error} />

      {loading ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-12 text-center text-sm font-semibold text-white/40">
          Loading seasons…
        </div>
      ) : (
        <>
          {/* Schedule a new season */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#FFB800]/25 bg-[#FFB800]/[0.05] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarPlus className="size-4 text-[#FFB800]" />
              <span className="font-display text-[15px] font-extrabold text-white">
                Schedule a season
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
                  NAME (OPTIONAL)
                </span>
                <input
                  className={inputCls}
                  value={form.name}
                  placeholder="e.g. Season 3"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
                  START (BLANK = TODAY)
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
                  END (BLANK = OPEN)
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                />
              </label>
              <button
                type="button"
                onClick={schedule}
                disabled={busy}
                className={`${btn.primary} flex items-center justify-center gap-2`}
              >
                <CalendarPlus className="size-4" /> Schedule
              </button>
            </div>
            {active && (
              <p className="text-[11.5px] font-semibold text-white/35">
                “{active.name}” is open-ended — scheduling a new season sets its end
                to the new start date (a clean rollover).
              </p>
            )}
          </div>

          {/* Active */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-extrabold tracking-[1px] text-white/40">
              CURRENT SEASON
            </span>
            {active ? (
              seasonRow(active, "border-[#6FCF97]/25 bg-[#6FCF97]/[0.04]")
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-8 text-[13px] font-semibold text-white/45">
                <CalendarRange className="size-4 text-white/40" />
                No active season — the league is dormant until one starts.
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-extrabold tracking-[1px] text-white/40">
                UPCOMING
              </span>
              {upcoming.map((s) =>
                seasonRow(s, "border-[#4FA3E0]/20 bg-[#4FA3E0]/[0.03]"),
              )}
            </div>
          )}

          {/* Past */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-extrabold tracking-[1px] text-white/40">
              PAST SEASONS
            </span>
            {closed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-[13px] font-semibold text-white/40">
                No closed seasons yet.
              </div>
            ) : (
              closed.map((s) => seasonRow(s, "border-white/[0.08] bg-[#101114]"))
            )}
          </div>
        </>
      )}
    </div>
  );
}
