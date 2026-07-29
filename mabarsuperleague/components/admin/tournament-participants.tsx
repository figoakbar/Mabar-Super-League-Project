"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Plus, Trash2, X } from "lucide-react";

import {
  api,
  API_ORIGIN,
  type Participant,
  type Tournament,
} from "@/lib/admin/api";
import { btn, ErrorNote, Field, Modal, StatusPill } from "@/components/admin/ui";

const TABS = ["all", "confirmed", "pending", "rejected"] as const;
type Tab = (typeof TABS)[number];

const tabLabel: Record<Tab, string> = {
  all: "All",
  confirmed: "Confirmed",
  pending: "Pending",
  rejected: "Rejected",
};

/**
 * Participants of one tournament, shown inline under its row in the Tournaments
 * table. Confirmed and pending entrants live side by side here so an admin can
 * see the real state of a bracket without leaving the page.
 */
export function TournamentParticipants({
  tournament,
  onChanged,
}: {
  tournament: Tournament;
  /** Lets the parent refresh its "N / M teams" count. */
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<Participant[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ team: "", captain: "", contact: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setRows(await api.listParticipants(tournament.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load participants");
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listParticipants(tournament.id);
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
  }, [tournament.id]);

  async function setStatus(p: Participant, status: Participant["status"]) {
    setBusy(p.id);
    setError(null);
    try {
      await api.updateParticipant(p.id, { status });
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: Participant) {
    if (!confirm(`Remove ${p.team} from ${tournament.name}?`)) return;
    setBusy(p.id);
    setError(null);
    try {
      await api.deleteParticipant(p.id);
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      // Added by hand from here = already an official participant.
      await api.createParticipant({
        tournamentId: tournament.id,
        team: form.team.trim(),
        captain: form.captain,
        contact: form.contact,
        status: "confirmed",
      });
      setAdding(false);
      setForm({ team: "", captain: "", contact: "" });
      await load();
      onChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const counts = {
    all: rows.length,
    confirmed: rows.filter((p) => p.status === "confirmed").length,
    pending: rows.filter((p) => p.status === "pending").length,
    rejected: rows.filter((p) => p.status === "rejected").length,
  };
  const shown = tab === "all" ? rows : rows.filter((p) => p.status === tab);

  return (
    <div className="flex flex-col gap-3.5 border-t border-white/[0.08] bg-black/25 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`cursor-pointer rounded-md border px-2.5 py-1 text-[11.5px] font-extrabold transition-colors ${
                  active
                    ? "border-[#FFB800] bg-[#FFB800] text-[#0A0B0D]"
                    : "border-white/[0.14] text-white/55 hover:text-white"
                }`}
              >
                {tabLabel[t]} ({counts[t]})
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setAdding(true);
          }}
          className={btn.chip}
        >
          <Plus className="mr-1 inline size-3.5 align-[-2px]" />
          Add participant
        </button>
      </div>

      <ErrorNote message={error} />

      {loading ? (
        <p className="py-6 text-center text-[13px] font-semibold text-white/35">
          Loading participants…
        </p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-[13px] font-semibold text-white/35">
          {tab === "all"
            ? "No one has registered for this tournament yet."
            : `No ${tabLabel[tab].toLowerCase()} participants.`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] text-[10.5px] font-extrabold uppercase tracking-[1px] text-white/35">
                <th className="px-3 py-2">Player / team</th>
                <th className="px-3 py-2">Payment proof</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/[0.04] last:border-0"
                >
                  <td className="px-3 py-2.5">
                    <span className="text-[13.5px] font-extrabold text-white">
                      {p.team}
                    </span>
                    {p.contact && (
                      <span className="ml-2 text-[11.5px] font-semibold text-white/35">
                        {p.contact}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {p.receiptUrl ? (
                      <a
                        href={`${API_ORIGIN}${p.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#4FA3E0]/40 bg-[#4FA3E0]/10 px-2 py-0.5 text-[11px] font-extrabold text-[#4FA3E0] transition-colors hover:bg-[#4FA3E0]/20"
                      >
                        <FileText className="size-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-white/25">
                        No proof
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status !== "confirmed" && (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => void setStatus(p, "confirmed")}
                          className="cursor-pointer rounded-md border border-[#6FCF97]/40 bg-[#6FCF97]/10 px-2 py-1 text-[11px] font-extrabold text-[#6FCF97] transition-colors hover:bg-[#6FCF97]/20 disabled:opacity-40"
                        >
                          <Check className="mr-1 inline size-3 align-[-1px]" />
                          Confirm
                        </button>
                      )}
                      {p.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => void setStatus(p, "rejected")}
                          className="cursor-pointer rounded-md border border-white/[0.14] px-2 py-1 text-[11px] font-bold text-white/50 transition-colors hover:text-white disabled:opacity-40"
                        >
                          <X className="mr-1 inline size-3 align-[-1px]" />
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => void remove(p)}
                        aria-label={`Remove ${p.team}`}
                        className="cursor-pointer rounded-md p-1.5 text-white/35 transition-colors hover:bg-[#E07A72]/10 hover:text-[#E07A72] disabled:opacity-40"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <Modal
          title={`Add participant — ${tournament.name}`}
          onClose={() => setAdding(false)}
        >
          <form onSubmit={add} className="flex flex-col gap-4">
            <Field
              label="PLAYER / TEAM NAME"
              required
              value={form.team}
              onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="CAPTAIN"
                value={form.captain}
                onChange={(e) =>
                  setForm((f) => ({ ...f, captain: e.target.value }))
                }
              />
              <Field
                label="CONTACT"
                value={form.contact}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact: e.target.value }))
                }
              />
            </div>
            <p className="text-[12px] font-semibold text-white/35">
              Added here counts as confirmed straight away.
            </p>
            <ErrorNote message={formError} />
            <div className="mt-1 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className={btn.ghost}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btn.primary}>
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
