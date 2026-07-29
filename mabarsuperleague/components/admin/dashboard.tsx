"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swords, Trophy, Users } from "lucide-react";

import { api, type Match, type Participant, type Tournament } from "@/lib/admin/api";
import { ErrorNote, StatusPill } from "@/components/admin/ui";

export function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, p, m] = await Promise.all([
          api.listTournaments(),
          api.listParticipants(),
          api.listMatches(),
        ]);
        setTournaments(t);
        setParticipants(p);
        setMatches(m);
      } catch (e) {
        setError(
          e instanceof Error
            ? `${e.message}. Is the backend running on ${
                process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
              }?`
            : "Failed to load",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    {
      label: "Tournaments",
      value: tournaments.length,
      icon: Trophy,
      href: "/admin/tournaments",
      color: "#FFB800",
    },
    {
      label: "Participants",
      value: participants.length,
      icon: Users,
      // Participants now live inside each tournament row.
      href: "/admin/tournaments",
      color: "#4FA3E0",
    },
    {
      label: "Matches",
      value: matches.length,
      icon: Swords,
      href: "/admin/matches",
      color: "#6FCF97",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm font-semibold text-white/45">
          Overview of tournaments, teams, and matches.
        </p>
      </div>

      <ErrorNote message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#101114] p-5 transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl"
                style={{ background: `${s.color}22` }}
              >
                <Icon className="size-6" style={{ color: s.color }} />
              </span>
              <div>
                <div className="font-display text-3xl font-extrabold text-white">
                  {loading ? "—" : s.value}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-[1px] text-white/40">
                  {s.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-extrabold text-white">
          Recent tournaments
        </h2>
        <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#101114] px-5">
          {loading ? (
            <div className="py-8 text-center text-sm text-white/40">Loading…</div>
          ) : tournaments.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/40">
              No tournaments yet.
            </div>
          ) : (
            tournaments.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href="/admin/tournaments"
                className="flex items-center justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-extrabold text-white">
                    {t.name}
                  </div>
                  <div className="text-xs font-semibold text-white/40">
                    {t.game} · {t.registeredTeams}/{t.maxTeams} teams
                  </div>
                </div>
                <StatusPill status={t.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
