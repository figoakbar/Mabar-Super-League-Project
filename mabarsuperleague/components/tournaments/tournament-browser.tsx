"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { isRegistrationClosed } from "@/lib/tournaments/registration";

import {
  api,
  formatLabel,
  type Participant,
  type Tournament,
} from "@/lib/admin/api";
import {
  formatDate,
  rupiah,
  tierAccent,
  tierShort,
} from "@/lib/data/tournament-view";

type MyStatus = Participant["status"];

type Tab = "open" | "live" | "completed";

/**
 * Every tournament has a home here: open ones take registrations, live ones
 * (registration closed or under way) show their bracket, and finished or
 * cancelled ones keep their results.
 */
function tabOf(t: Tournament): Tab {
  if (t.status === "open") return "open";
  if (t.status === "closed" || t.status === "ongoing") return "live";
  return "completed";
}

const TABS: {
  key: Tab;
  label: string;
  title: string;
  sub: string;
  empty: string;
}[] = [
  {
    key: "open",
    label: "OPEN",
    title: "Open Tournaments",
    sub: "Register now — slots are limited per bracket.",
    empty:
      "No tournaments are open for registration right now. Check back soon.",
  },
  {
    key: "live",
    label: "LIVE",
    title: "Live Tournaments",
    sub: "Registration has closed — follow the draw, scores and bracket.",
    empty: "No tournaments are running right now.",
  },
  {
    key: "completed",
    label: "COMPLETED",
    title: "Completed Tournaments",
    sub: "Final results and brackets from past tournaments.",
    empty: "No tournaments have finished yet.",
  },
];

export function TournamentBrowser({ username }: { username: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tab, setTab] = useState<Tab>("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map of tournamentId -> the current user's registration status.
  const [myStatus, setMyStatus] = useState<Record<string, MyStatus>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [all, mine] = await Promise.all([
          api.listTournaments(),
          api.myRegistrations(username).catch(() => [] as Participant[]),
        ]);
        if (!active) return;
        setTournaments(all);
        const map: Record<string, MyStatus> = {};
        for (const p of mine) map[p.tournamentId] = p.status;
        setMyStatus(map);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Failed to load tournaments",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [username]);

  const current = TABS.find((x) => x.key === tab)!;
  const shown = tournaments
    .filter((t) => tabOf(t) === tab)
    // Live: matches under way before those still waiting for the draw, then
    // soonest first. Completed: most recent first.
    .sort((a, b) =>
      tab === "completed"
        ? b.startDate.localeCompare(a.startDate)
        : Number(b.status === "ongoing") - Number(a.status === "ongoing") ||
          a.startDate.localeCompare(b.startDate),
    );
  const count = (key: Tab) =>
    tournaments.filter((t) => tabOf(t) === key).length;

  const tabClass = (active: boolean) =>
    `cursor-pointer whitespace-nowrap rounded-[5px] px-3 py-1.5 text-xs font-extrabold tracking-[0.5px] transition-colors ${
      active ? "bg-[#FFB800] text-[#0A0B0D]" : "bg-transparent text-white/50"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[26px] font-extrabold text-white">
            {current.title}
          </h2>
          <span className="text-[13.5px] font-semibold text-white/45">
            {current.sub}
          </span>
        </div>
        <div
          role="tablist"
          aria-label="Tournament status"
          className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#101114] p-1"
        >
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={tabClass(tab === x.key)}
            >
              {x.label}
              {!loading && ` (${count(x.key)})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#E07A72]/30 bg-[#E07A72]/10 px-5 py-4 text-sm font-semibold text-[#E07A72]">
          {error}. Is the backend running?
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
          Loading tournaments…
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
          {current.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => {
            // The card takes its colour from the tournament tier, so the whole
            // Tournaments list is scannable by tier at a glance.
            const accent = tierAccent(t.tier);
            const mine = myStatus[t.id];
            // registeredTeams counts places held (pending + confirmed), the
            // same rule the tournament page and the server use.
            const isFull = t.registeredTeams >= t.maxTeams;
            const isClosed = isRegistrationClosed(t.registrationDeadline);
            const pct =
              t.maxTeams > 0
                ? Math.round((t.registeredTeams / t.maxTeams) * 100)
                : 0;
            const isOpen = t.status === "open";
            const badge =
              t.status === "ongoing"
                ? {
                    label: "LIVE",
                    color: "#E06055",
                    bg: "rgba(224,96,85,0.14)",
                    pulse: true,
                  }
                : t.status === "closed"
                  ? {
                      label: "STARTING SOON",
                      color: "#D98E52",
                      bg: "rgba(217,142,82,0.14)",
                    }
                  : t.status === "completed"
                    ? {
                        label: "COMPLETED",
                        color: "rgba(255,255,255,0.55)",
                        bg: "rgba(255,255,255,0.06)",
                      }
                    : t.status === "cancelled"
                      ? {
                          label: "CANCELLED",
                          color: "#E07A72",
                          bg: "rgba(224,122,114,0.14)",
                        }
                      : mine === "confirmed"
                        ? {
                            label: "JOINED",
                            color: "#6FCF97",
                            bg: "rgba(111,207,151,0.14)",
                          }
                        : mine === "pending"
                          ? {
                              label: "PENDING",
                              color: "#FFB800",
                              bg: "rgba(255,184,0,0.14)",
                            }
                          : isClosed
                            ? {
                                label: "CLOSED",
                                color: "rgba(255,255,255,0.4)",
                                bg: "rgba(255,255,255,0.06)",
                              }
                            : isFull
                              ? {
                                  label: "FULL",
                                  color: "rgba(255,255,255,0.4)",
                                  bg: "rgba(255,255,255,0.06)",
                                }
                              : {
                                  label: "OPEN",
                                  color: "#6FCF97",
                                  bg: "rgba(111,207,151,0.12)",
                                  pulse: true,
                                };

            return (
              <article
                key={t.id}
                className="relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114] transition hover:-translate-y-1 hover:border-white/25"
              >
                <div className="h-[3px]" style={{ background: accent }} />

                <div className="flex items-center justify-between gap-2.5 px-[22px] pt-5">
                  <span
                    className="text-[10.5px] font-extrabold tracking-[1.5px]"
                    style={{ color: accent }}
                  >
                    {t.game.toUpperCase()}
                  </span>
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: badge.bg }}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        "pulse" in badge && badge.pulse
                          ? "[animation:pulse-soft_1.4s_ease-in-out_infinite]"
                          : ""
                      }`}
                      style={{ background: badge.color }}
                    />
                    <span
                      className="text-[10.5px] font-extrabold tracking-[0.5px]"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="px-[22px] pt-2">
                  <Link
                    href={`/tournaments/${t.id}`}
                    className="font-display text-[19px] font-bold leading-[1.25] text-white transition-colors hover:text-[#FFDD66]"
                  >
                    {t.name}
                  </Link>
                  <p className="mt-[3px] text-[12.5px] font-semibold text-white/45">
                    {formatLabel(t.format)}
                  </p>
                  {t.platforms?.trim() && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {t.platforms
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((p) => (
                          <span
                            key={p}
                            className="rounded-md border px-2 py-0.5 text-[11px] font-extrabold"
                            style={{
                              borderColor: `${accent}66`,
                              background: `${accent}1f`,
                              color: accent,
                            }}
                          >
                            {p}
                          </span>
                        ))}
                    </div>
                  )}
                  {t.tier === "exhibition" ? (
                    <p
                      className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.5px]"
                      style={{ color: accent }}
                    >
                      Exhibition · no points
                    </p>
                  ) : (
                    <p className="mt-2 text-[11.5px] font-bold text-white/45">
                      <span
                        className="font-extrabold"
                        style={{ color: accent }}
                      >
                        ★ {tierShort(t.tier)}
                      </span>{" "}
                      · up to{" "}
                      <span className="font-extrabold text-white/70">
                        {t.seasonPoints.champion}
                      </span>{" "}
                      pts
                    </p>
                  )}
                </div>

                {!isOpen ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 px-[22px] py-4">
                      <div className="flex flex-col gap-px">
                        <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                          {tab === "completed" ? "PLAYED" : "STARTS"}
                        </span>
                        <span className="font-display text-base font-bold text-white">
                          {formatDate(t.startDate)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-px">
                        <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                          PLAYERS
                        </span>
                        <span className="font-display text-base font-bold text-white">
                          {t.confirmedTeams}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto px-[22px] pb-[18px]">
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="block w-full rounded-[10px] border border-white/[0.14] bg-white/5 p-3 text-center font-display text-[14.5px] font-extrabold text-white transition hover:bg-white/10"
                      >
                        {t.status === "closed"
                          ? "View players"
                          : t.status === "cancelled"
                            ? "View tournament"
                            : t.format === "racing"
                              ? "View results"
                              : t.status === "completed"
                                ? "View results"
                                : "View bracket"}
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 px-[22px] py-4">
                      <div className="flex flex-col gap-px">
                        <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                          REGISTRATION ENDS
                        </span>
                        <span className="font-display text-base font-bold text-white">
                          {formatDate(t.registrationDeadline)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-px">
                        <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                          ENTRY FEE
                        </span>
                        <span className="font-display text-base font-bold text-[#FFB800]">
                          {rupiah(t.entryFee)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 px-[22px] pb-[18px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11.5px] font-bold text-white/45">
                          <span>
                            {t.registeredTeams} / {t.maxTeams} slots filled
                          </span>
                          <span style={{ color: accent }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: accent }}
                          />
                        </div>
                      </div>

                      {mine === "confirmed" ? (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="w-full rounded-[10px] border border-[#6FCF97]/40 bg-[#6FCF97]/10 p-3 text-center font-display text-[14.5px] font-extrabold text-[#6FCF97] transition hover:bg-[#6FCF97]/20"
                        >
                          Joined ✓
                        </Link>
                      ) : mine === "pending" ? (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="w-full rounded-[10px] border border-[#FFB800]/40 bg-[#FFB800]/10 p-3 text-center font-display text-[14.5px] font-extrabold text-[#FFB800] transition hover:bg-[#FFB800]/20"
                        >
                          Pending review
                        </Link>
                      ) : isClosed || isFull ? (
                        <div className="w-full rounded-[10px] border border-white/[0.08] bg-white/5 p-3 text-center font-display text-[14.5px] font-bold text-white/35">
                          {isClosed ? "Registration Closed" : "Bracket Full"}
                        </div>
                      ) : (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="w-full rounded-[10px] bg-[#FFB800] p-3 text-center font-display text-[14.5px] font-extrabold text-[#0A0B0D] transition hover:brightness-110"
                        >
                          Register Now
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
