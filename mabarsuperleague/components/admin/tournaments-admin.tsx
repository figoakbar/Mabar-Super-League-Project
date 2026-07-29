"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

import {
  api,
  FORMAT_OPTIONS,
  formatLabel,
  type ScheduleInput,
  type Tournament,
  type TournamentFormat,
} from "@/lib/admin/api";
import {
  btn,
  ErrorNote,
  Field,
  Modal,
  Select,
  StatusPill,
  TextArea,
} from "@/components/admin/ui";
import { TournamentParticipants } from "@/components/admin/tournament-participants";
import { formatDate } from "@/lib/data/tournament-view";

const empty = {
  name: "",
  game: "",
  status: "open",
  format: "knockout",
  description: "",
  prizePool: "0",
  entryFee: "0",
  maxTeams: "16",
  startDate: "",
  registrationDeadline: "",
};
type FormState = typeof empty;

/** One editable schedule row in the form. */
type ScheduleRow = { label: string; date: string; time: string };
const emptyRow: ScheduleRow = { label: "", date: "", time: "" };

function toForm(t: Tournament): FormState {
  return {
    name: t.name,
    game: t.game,
    status: t.status,
    format: t.format,
    description: t.description,
    prizePool: String(t.prizePool),
    entryFee: String(t.entryFee),
    maxTeams: String(t.maxTeams),
    startDate: t.startDate,
    registrationDeadline: t.registrationDeadline,
  };
}

function toRows(t: Tournament): ScheduleRow[] {
  return t.schedule.map((s) => ({
    label: s.label,
    date: s.date,
    time: s.time,
  }));
}

const rupiah = (n: number) =>
  n === 0 ? "Free" : `Rp ${n.toLocaleString("id-ID")}`;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Month/year of a tournament, taken from its start date. Returns null when the
 * date is missing or unparseable, so such rows simply drop out of a dated
 * filter instead of being lumped into the wrong month.
 */
function startedOn(t: Tournament): { year: number; month: number } | null {
  if (!t.startDate) return null;
  const d = new Date(t.startDate);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function TournamentsAdmin() {
  const [rows, setRows] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Filters. "" means "any". */
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [game, setGame] = useState("");

  /** Which tournament's participant list is expanded, if any. */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.listTournaments());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listTournaments();
        if (active) setRows(data);
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

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setSchedule([]);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(t: Tournament) {
    setEditing(t);
    setForm(toForm(t));
    setSchedule(toRows(t));
    setFormError(null);
    setOpen(true);
  }

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setRow = (i: number, k: keyof ScheduleRow, v: string) =>
    setSchedule((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const addRow = () => setSchedule((rows) => [...rows, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setSchedule((rows) => rows.filter((_, idx) => idx !== i));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      game: form.game.trim(),
      status: form.status as Tournament["status"],
      format: form.format as TournamentFormat,
      description: form.description,
      prizePool: Number(form.prizePool) || 0,
      entryFee: Number(form.entryFee) || 0,
      maxTeams: Number(form.maxTeams) || 0,
      startDate: form.startDate,
      registrationDeadline: form.registrationDeadline,
      // Blank labels are dropped; order follows the rows as arranged.
      schedule: schedule
        .filter((r) => r.label.trim().length > 0)
        .map((r, i): ScheduleInput => ({
          label: r.label.trim(),
          date: r.date,
          time: r.time.trim(),
          position: i,
        })),
    };
    try {
      if (editing) await api.updateTournament(editing.id, payload);
      else await api.createTournament(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: Tournament) {
    if (!confirm(`Delete "${t.name}"? This also removes its teams and matches.`))
      return;
    try {
      await api.deleteTournament(t.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  // Only offer years and games that actually have tournaments, so a picker can
  // never point at an empty result.
  const years = Array.from(
    new Set(rows.map((t) => startedOn(t)?.year).filter((y): y is number => !!y)),
  ).sort((a, b) => b - a);

  const games = Array.from(new Set(rows.map((t) => t.game).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );

  const shown = rows.filter((t) => {
    if (game && t.game !== game) return false;
    if (!month && !year) return true;
    const on = startedOn(t);
    if (!on) return false; // undated rows cannot match a month or year
    if (year && on.year !== Number(year)) return false;
    if (month && on.month !== Number(month)) return false;
    return true;
  });

  const filtering = Boolean(month || year || game);

  function resetFilters() {
    setMonth("");
    setYear("");
    setGame("");
  }

  // Collapsing on filter change avoids a participant panel staying "open" on a
  // row that is no longer in the list.
  function changeFilter(next: () => void) {
    setExpandedId(null);
    next();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Tournaments
          </h1>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Create, edit, and remove tournaments — open a row to manage its
            participants.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={btn.primary}>
          <Plus className="mr-1.5 inline size-4 align-[-2px]" />
          New tournament
        </button>
      </div>

      {/* Filter by game, and by when the tournament starts */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-52">
          <Select
            label="GAME"
            value={game}
            onChange={(e) => changeFilter(() => setGame(e.target.value))}
          >
            <option value="">All games</option>
            {games.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="MONTH"
            value={month}
            onChange={(e) => changeFilter(() => setMonth(e.target.value))}
          >
            <option value="">All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-36">
          <Select
            label="YEAR"
            value={year}
            onChange={(e) => changeFilter(() => setYear(e.target.value))}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        {filtering && (
          <button
            type="button"
            onClick={() => changeFilter(resetFilters)}
            className={`${btn.ghost} mb-px`}
          >
            Clear
          </button>
        )}
        <span className="mb-2.5 text-[12.5px] font-semibold text-white/40">
          {loading
            ? ""
            : filtering
              ? `${shown.length} of ${rows.length} tournaments`
              : `${rows.length} tournaments`}
        </span>
      </div>

      <ErrorNote message={error} />

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Game</th>
              <th className="px-5 py-3.5">Starts</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Teams</th>
              <th className="px-5 py-3.5">Prize</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                  No tournaments yet. Create your first one.
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-white/40">
                  No tournaments match these filters.{" "}
                  <button
                    type="button"
                    onClick={() => changeFilter(resetFilters)}
                    className="cursor-pointer font-extrabold text-[#FFB800] hover:underline"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              shown.flatMap((t) => {
                const expanded = expandedId === t.id;
                return [
                <tr
                  key={t.id}
                  className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : t.id)}
                      aria-expanded={expanded}
                      className="flex cursor-pointer items-start gap-2 text-left"
                    >
                      {expanded ? (
                        <ChevronDown className="mt-0.5 size-4 shrink-0 text-[#FFB800]" />
                      ) : (
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-white/35" />
                      )}
                      <span>
                        <span className="block font-extrabold text-white">
                          {t.name}
                        </span>
                        <span className="block text-xs font-semibold text-white/40">
                          {formatLabel(t.format)}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-white/70">
                    {t.game}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-white/70">
                    {formatDate(t.startDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : t.id)}
                      className="cursor-pointer text-sm font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#FFB800]"
                    >
                      {t.registeredTeams} / {t.maxTeams}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#FFB800]">
                    {rupiah(t.prizePool)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className={btn.chip}
                      >
                        <Pencil className="mr-1 inline size-3.5 align-[-2px]" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(t)}
                        className={btn.danger}
                      >
                        <Trash2 className="mr-1 inline size-3.5 align-[-2px]" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>,
                expanded ? (
                  <tr key={`${t.id}-participants`}>
                    <td colSpan={7} className="p-0">
                      <TournamentParticipants tournament={t} onChanged={load} />
                    </td>
                  </tr>
                ) : null,
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal
          title={editing ? "Edit tournament" : "New tournament"}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="NAME"
                required
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
              <Field
                label="GAME"
                required
                value={form.game}
                onChange={(e) => set("game")(e.target.value)}
              />
              <Select
                label="STATUS"
                value={form.status}
                onChange={(e) => set("status")(e.target.value)}
              >
                <option value="open">open</option>
                <option value="ongoing">ongoing</option>
                <option value="completed">completed</option>
              </Select>
              <Select
                label="FORMAT"
                value={form.format}
                onChange={(e) => set("format")(e.target.value)}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Field
                label="PRIZE POOL (Rp)"
                type="number"
                min={0}
                value={form.prizePool}
                onChange={(e) => set("prizePool")(e.target.value)}
              />
              <Field
                label="ENTRY FEE (Rp)"
                type="number"
                min={0}
                value={form.entryFee}
                onChange={(e) => set("entryFee")(e.target.value)}
              />
              <Field
                label="MAX TEAMS"
                type="number"
                min={0}
                value={form.maxTeams}
                onChange={(e) => set("maxTeams")(e.target.value)}
              />
              <Field
                label="START DATE"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate")(e.target.value)}
              />
              <Field
                label="REGISTRATION DEADLINE"
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => set("registrationDeadline")(e.target.value)}
              />
            </div>
            <TextArea
              label="DESCRIPTION"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
            />

            {/* Schedule builder — rows appear on the public tournament page */}
            <div className="flex flex-col gap-2.5 rounded-[10px] border border-white/[0.08] bg-black/25 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
                    SCHEDULE
                  </span>
                  <span className="text-[11.5px] font-semibold text-white/35">
                    Bracket draw, round dates, finals — shown on the tournament
                    page.
                  </span>
                </div>
                <button type="button" onClick={addRow} className={btn.chip}>
                  <Plus className="mr-1 inline size-3.5 align-[-2px]" />
                  Add
                </button>
              </div>

              {schedule.length === 0 ? (
                <p className="py-3 text-center text-[12.5px] font-semibold text-white/30">
                  No schedule entries yet.
                </p>
              ) : (
                schedule.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]"
                  >
                    <Field
                      label="LABEL"
                      placeholder="e.g. Bracket draw"
                      value={row.label}
                      onChange={(e) => setRow(i, "label", e.target.value)}
                    />
                    <Field
                      label="DATE"
                      type="date"
                      value={row.date}
                      onChange={(e) => setRow(i, "date", e.target.value)}
                    />
                    <Field
                      label="TIME"
                      placeholder="19:00 WIB"
                      value={row.time}
                      onChange={(e) => setRow(i, "time", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className={`${btn.danger} mb-[3px]`}
                      aria-label={`Remove schedule row ${i + 1}`}
                    >
                      <Trash2 className="inline size-3.5 align-[-2px]" />
                    </button>
                  </div>
                ))
              )}
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
                {saving ? "Saving…" : editing ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
