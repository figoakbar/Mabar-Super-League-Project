"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, type Participant } from "@/lib/admin/api";
import { tierAccent, tierShort } from "@/lib/data/tournament-view";

export type TournamentEntry = {
  tid: string;
  accent: string;
  tierLabel: string;
  gameLabel: string;
  name: string;
  status: string;
  statusBg: string;
  statusColor: string;
  note: string;
  href: string;
  live?: boolean;
};

function TournamentCard({ t }: { t: TournamentEntry }) {
  return (
    <Link
      href={t.href}
      className="relative block overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#101114] transition-colors hover:border-white/[0.22]"
    >
      {/* accent strip along the left edge — the card's tier colour. Inline
          styles (not Tailwind arbitrary classes) so it always renders, even if
          a cached/older stylesheet is missing the generated width rule. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "3px",
          background: t.accent,
        }}
      />
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className="text-[10.5px] font-extrabold tracking-[1.5px]"
            style={{ color: t.accent }}
          >
            {t.gameLabel}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15.5px] font-extrabold text-white">
              {t.name}
            </span>
            {/* tier badge — inline styles so it survives a stale stylesheet */}
            <span
              className="inline-flex items-center gap-1 font-extrabold uppercase"
              style={{
                color: t.accent,
                background: `${t.accent}1f`,
                fontSize: "10px",
                letterSpacing: "0.5px",
                padding: "2px 7px",
                borderRadius: "5px",
              }}
            >
              <span aria-hidden>★</span>
              {t.tierLabel}
            </span>
          </div>
        </div>
        <div
          className="shrink-0 whitespace-nowrap rounded-[5px] px-3 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.8px]"
          style={{ background: t.statusBg, color: t.statusColor }}
        >
          {t.status}
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-5 py-2.5">
        {t.live ? (
          <span className="relative flex size-[7px]">
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
              style={{ background: t.statusColor }}
            />
            <span
              className="relative inline-flex size-[7px] rounded-full"
              style={{ background: t.statusColor }}
            />
          </span>
        ) : (
          <span
            className="size-[7px] rounded-full"
            style={{ background: t.statusColor }}
          />
        )}
        <span className="text-[12px] font-semibold text-white/45">
          {t.note}
        </span>
      </div>
    </Link>
  );
}

const STATUS = {
  joined: {
    status: "Joined",
    statusBg: "rgba(111,207,151,0.12)",
    statusColor: "#6FCF97",
    note: "You're confirmed for this tournament. See you on the bracket.",
  },
  pending: {
    status: "Pending",
    statusBg: "rgba(255,184,0,0.12)",
    statusColor: "#FFB800",
    note: "Payment proof under review — slot confirmed after verification.",
  },
  ongoing: {
    status: "Ongoing",
    statusBg: "rgba(224,96,85,0.14)",
    statusColor: "#E06055",
    note: "This tournament is live — check the bracket for your matches.",
    live: true,
  },
  completed: {
    status: "Completed",
    statusBg: "rgba(199,206,220,0.1)",
    statusColor: "#C7CEDC",
    note: "This tournament has finished.",
  },
};

function toEntry(r: Participant): TournamentEntry {
  const game = r.tournament?.game ?? "Tournament";
  const tier = r.tournament?.tier ?? "minor";
  const tStatus = r.tournament?.status;
  // A confirmed player sees "Ongoing" once the tournament is live, "Joined"
  // while it's still before kickoff; pending stays pending; finished shows done.
  const style =
    tStatus === "completed"
      ? STATUS.completed
      : r.status !== "confirmed"
        ? STATUS.pending
        : tStatus === "ongoing"
          ? STATUS.ongoing
          : STATUS.joined;
  return {
    tid: r.tournamentId,
    // Strip colour + label reflect the tournament tier (minor / major /
    // championship / exhibition) — matching the Tournaments page and How to Play.
    accent: tierAccent(tier),
    tierLabel: tierShort(tier),
    gameLabel: game.toUpperCase(),
    name: r.tournament?.name ?? "Tournament",
    href: `/tournaments/${r.tournamentId}`,
    ...style,
  };
}

export function TournamentTabs({ username }: { username: string }) {
  const [tab, setTab] = useState<"ongoing" | "past">("ongoing");
  const [ongoing, setOngoing] = useState<TournamentEntry[]>([]);
  const [past, setPast] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const regs = await api.myRegistrations(username);
        if (!active) return;
        // Latest registration per tournament wins; drop rejected ones.
        const byTournament = new Map<string, Participant>();
        for (const r of regs) byTournament.set(r.tournamentId, r);
        const live: TournamentEntry[] = [];
        const finished: TournamentEntry[] = [];
        for (const r of byTournament.values()) {
          if (r.status === "rejected") continue;
          const entry = toEntry(r);
          if (r.tournament?.status === "completed") finished.push(entry);
          else live.push(entry);
        }
        setOngoing(live);
        setPast(finished);
      } catch {
        // backend down — leave the lists empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [username]);

  const list = tab === "ongoing" ? ongoing : past;

  const tabClass = (active: boolean) =>
    `cursor-pointer rounded-[5px] px-4 py-1.5 text-xs font-extrabold tracking-[0.5px] transition-colors ${
      active ? "bg-[#FFB800] text-[#0A0B0D]" : "bg-transparent text-white/50"
    }`;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
          My Tournaments
        </h2>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#101114] p-1">
          <button
            type="button"
            onClick={() => setTab("ongoing")}
            className={tabClass(tab === "ongoing")}
          >
            ONGOING
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={tabClass(tab === "past")}
          >
            PAST
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="rounded-[10px] border border-white/[0.08] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-white/[0.14] bg-[#101114] px-5 py-10 text-center text-sm font-semibold text-white/40">
            {tab === "ongoing" ? (
              <>
                You haven&apos;t joined any tournaments yet.{" "}
                <Link
                  href="/tournaments"
                  className="font-extrabold text-[#FFB800] hover:underline"
                >
                  Browse open tournaments →
                </Link>
              </>
            ) : (
              "No completed tournaments yet."
            )}
          </div>
        ) : (
          list.map((t) => <TournamentCard key={t.tid} t={t} />)
        )}
      </div>
    </section>
  );
}
