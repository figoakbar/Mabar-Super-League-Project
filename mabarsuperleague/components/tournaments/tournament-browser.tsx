"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  api,
  formatLabel,
  type Participant,
  type Tournament,
} from "@/lib/admin/api";
import { accentFor, formatDate, rupiah } from "@/lib/data/tournament-view";

type MyStatus = Participant["status"];

export function TournamentBrowser({ username }: { username: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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
        // The Tournaments menu lists tournaments open for registration.
        setTournaments(all.filter((t) => t.status === "open"));
        const map: Record<string, MyStatus> = {};
        for (const p of mine) map[p.tournamentId] = p.status;
        setMyStatus(map);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load tournaments");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [username]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[26px] font-extrabold text-white">
          Open Tournaments
        </h2>
        <span className="text-[13.5px] font-semibold text-white/45">
          Register now — slots are limited per bracket.
        </span>
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
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#101114] px-5 py-14 text-center text-sm font-semibold text-white/40">
          No tournaments are open for registration right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => {
            const accent = accentFor(t.game);
            const mine = myStatus[t.id];
            const isFull = t.registeredTeams >= t.maxTeams;
            const pct =
              t.maxTeams > 0
                ? Math.round((t.registeredTeams / t.maxTeams) * 100)
                : 0;
            const badge =
              mine === "confirmed"
                ? { label: "JOINED", color: "#6FCF97", bg: "rgba(111,207,151,0.14)" }
                : mine === "pending"
                  ? { label: "PENDING", color: "#FFB800", bg: "rgba(255,184,0,0.14)" }
                  : isFull
                    ? { label: "FULL", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)" }
                    : { label: "OPEN", color: "#6FCF97", bg: "rgba(111,207,151,0.12)" };

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
                      className="size-1.5 rounded-full [animation:pulse-soft_1.4s_ease-in-out_infinite]"
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
                </div>

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
                  ) : isFull ? (
                    <div className="w-full rounded-[10px] border border-white/[0.08] bg-white/5 p-3 text-center font-display text-[14.5px] font-bold text-white/35">
                      Bracket Full
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
