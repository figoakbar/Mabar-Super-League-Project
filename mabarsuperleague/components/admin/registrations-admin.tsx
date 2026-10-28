"use client";

import { useEffect, useState } from "react";
import { Check, FileText, X } from "lucide-react";

import {
  api,
  API_BASE_BROWSER,
  type Participant,
  type Tournament,
} from "@/lib/admin/api";
import { btn, ErrorNote, Select, StatusPill } from "@/components/admin/ui";

const statusFilters = ["pending", "confirmed", "rejected", "all"] as const;
type StatusFilter = (typeof statusFilters)[number];

const filterLabel: Record<StatusFilter, string> = {
  pending: "Needs review",
  confirmed: "Confirmed",
  rejected: "Rejected",
  all: "All",
};

/** How a tournament that no longer takes registrations is flagged on a row. */
const closedLabel: Record<string, string> = {
  closed: "Registration closed",
  ongoing: "Tournament live",
  completed: "Tournament finished",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationsAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rows, setRows] = useState<Participant[]>([]);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [tournamentId, setTournamentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [t, p] = await Promise.all([
        api.listTournaments(),
        api.listParticipants(),
      ]);
      setTournaments(t);
      setRows(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, p] = await Promise.all([
          api.listTournaments(),
          api.listParticipants(),
        ]);
        if (!active) return;
        setTournaments(t);
        setRows(p);
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

  // Confirmed and rejected entries are listed for open tournaments only, but a
  // registration awaiting review is always listed, whatever its tournament's
  // status — otherwise it drops out of sight the moment registration closes and
  // the player is left waiting for a decision that never comes.
  const openIds = new Set(
    tournaments.filter((t) => t.status === "open").map((t) => t.id),
  );
  const inScope = (p: Participant) =>
    p.status === "pending" || openIds.has(p.tournamentId);
  const isStale = (p: Participant) =>
    p.status === "pending" && !openIds.has(p.tournamentId);

  const scoped = rows.filter(inScope);
  const filterTournaments = tournaments.filter(
    (t) => openIds.has(t.id) || scoped.some((p) => p.tournamentId === t.id),
  );

  const shown = scoped
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => (tournamentId ? p.tournamentId === tournamentId : true))
    // Overdue reviews first: they block a draw or a refund.
    .sort((a, b) => Number(isStale(b)) - Number(isStale(a)));

  // Same number as the report's "Awaiting review" tile.
  const pendingCount = rows.filter((p) => p.status === "pending").length;
  const staleCount = rows.filter(isStale).length;

  async function review(p: Participant, next: "confirmed" | "rejected") {
    setBusy(p.id);
    setError(null);
    try {
      await api.updateParticipant(p.id, { status: next });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Registrations
          </h1>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Review payment proofs. Confirming makes the player an official
            participant. Every registration awaiting review is listed —
            including ones in tournaments that have already closed.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full border border-[#FFB800]/40 bg-[#FFB800]/[0.12] px-3.5 py-1.5 text-[12.5px] font-extrabold text-[#FFB800]">
            {pendingCount} awaiting review
          </span>
        )}
      </div>

      {staleCount > 0 && (
        <p
          role="status"
          className="rounded-xl px-4 py-3 text-[13px] font-semibold"
          style={{
            border: "1px solid rgba(224,160,79,0.35)",
            background: "rgba(224,160,79,0.08)",
            color: "#E0A04F",
          }}
        >
          {staleCount === 1
            ? "1 registration is still awaiting review in a tournament that no longer takes registrations."
            : `${staleCount} registrations are still awaiting review in tournaments that no longer take registrations.`}{" "}
          Confirm or reject them before the draw — a rejected player is owed a
          refund.
        </p>
      )}

      <ErrorNote message={error} />

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-56">
          <Select
            label="STATUS"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>
                {filterLabel[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-80">
          <Select
            label="TOURNAMENT"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
          >
            <option value="">All tournaments</option>
            {filterTournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.status === "open" ? "" : ` (${closedLabel[t.status] ?? t.status})`}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101114]">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
              <th className="px-5 py-3.5">Player / Team</th>
              <th className="px-5 py-3.5">Tournament</th>
              <th className="px-5 py-3.5">Payment proof</th>
              <th className="px-5 py-3.5">Submitted</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Review</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                  Loading…
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                  {status === "pending"
                    ? "Nothing to review — all registrations are handled."
                    : "No registrations here."}
                </td>
              </tr>
            ) : (
              shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-extrabold text-white">{p.team}</div>
                    {p.contact && (
                      <div className="text-xs font-semibold text-white/40">
                        {p.contact}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-white/60">
                    {p.tournament?.name ?? "—"}
                    {isStale(p) && (
                      <span
                        className="mt-1 block w-fit rounded px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.5px]"
                        style={{
                          background: "rgba(224,160,79,0.12)",
                          color: "#E0A04F",
                        }}
                      >
                        {closedLabel[p.tournament?.status ?? ""] ?? "Not open"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.receiptUrl ? (
                      <a
                        href={`${API_BASE_BROWSER}${p.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#4FA3E0]/40 bg-[#4FA3E0]/10 px-2.5 py-1 text-xs font-extrabold text-[#4FA3E0] transition-colors hover:bg-[#4FA3E0]/20"
                      >
                        <FileText className="size-3.5" />
                        View receipt
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-white/30">
                        No proof yet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-white/45">
                    {formatWhen(p.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            disabled={busy === p.id}
                            onClick={() => review(p, "confirmed")}
                            className="cursor-pointer rounded-lg border border-[#6FCF97]/40 bg-[#6FCF97]/10 px-3 py-1.5 text-xs font-extrabold text-[#6FCF97] transition-colors hover:bg-[#6FCF97]/20 disabled:opacity-50"
                          >
                            <Check className="mr-1 inline size-3.5 align-[-2px]" />
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={busy === p.id}
                            onClick={() => review(p, "rejected")}
                            className="cursor-pointer rounded-lg border border-[#E07A72]/40 bg-[#E07A72]/10 px-3 py-1.5 text-xs font-extrabold text-[#E07A72] transition-colors hover:bg-[#E07A72]/20 disabled:opacity-50"
                          >
                            <X className="mr-1 inline size-3.5 align-[-2px]" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() =>
                            review(
                              p,
                              p.status === "confirmed" ? "rejected" : "confirmed",
                            )
                          }
                          className={btn.chip}
                        >
                          {p.status === "confirmed" ? "Revoke" : "Confirm"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs font-semibold text-white/35">
        Confirmed registrations appear under{" "}
        <span className="font-extrabold text-white/55">Participants</span> as
        official tournament participants.
      </p>
    </div>
  );
}
