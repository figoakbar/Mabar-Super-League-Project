import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

/** A public-safe player card, with stats derived from real match history. */
export type PublicPlayer = {
  username: string;
  avatarUrl: string;
  memberSince: number;
  wins: number;
  losses: number;
  winRate: number; // 0–100
  trophies: number;
  mainGame: string;
  records: { game: string; w: number; l: number }[];
  championships: string[];
  tournaments: { name: string; game: string; date: string; result: string }[];
};

type PerTournament = {
  name: string;
  game: string;
  date: string; // formatted for display, e.g. "Apr 2025"
  sort: string; // raw startDate, so history sorts chronologically
  status: string;
  wins: number;
  losses: number;
  lostRound: string | null;
  wonFinal: boolean;
};

type Aggregate = {
  username: string;
  avatarUrl: string;
  createdAt: Date;
  wins: number;
  losses: number;
  perGame: Map<string, { w: number; l: number }>;
  tournaments: Map<string, PerTournament>;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2025-04-12" → "Apr 2025"; passes through anything unparseable. */
function formatDate(s: string): string {
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return s ?? "";
}

function resultLabel(t: PerTournament): string {
  if (t.wonFinal) return "Champion";
  if (t.lostRound === "Final") return "Runner-up";
  if (t.lostRound === "Semifinals") return "Semifinal";
  if (t.lostRound === "Quarterfinals") return "Quarterfinal";
  if (t.lostRound) return t.lostRound; // e.g. "Round of 16"
  if (t.status === "completed") return "Participated";
  if (t.status === "ongoing") return "Ongoing";
  return "Registered";
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The public Players directory. Stats come entirely from real data — completed
   * matches and confirmed registrations — keyed by the username stored on each
   * match/participant. Only public-safe fields are ever exposed.
   */
  async findAll(): Promise<PublicPlayer[]> {
    const [users, matches, participants] = await Promise.all([
      this.prisma.user.findMany({
        select: { username: true, avatarUrl: true, createdAt: true },
      }),
      this.prisma.match.findMany({
        where: { status: "completed", scoreA: { not: null }, scoreB: { not: null } },
        select: {
          teamA: true,
          teamB: true,
          scoreA: true,
          scoreB: true,
          round: true,
          tournament: {
            select: { id: true, name: true, game: true, startDate: true, status: true, tier: true },
          },
        },
      }),
      this.prisma.participant.findMany({
        where: { status: "confirmed" },
        select: {
          team: true,
          tournament: {
            select: { id: true, name: true, game: true, startDate: true, status: true, tier: true },
          },
        },
      }),
    ]);

    const agg = new Map<string, Aggregate>();
    for (const u of users) {
      agg.set(u.username, {
        username: u.username,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        wins: 0,
        losses: 0,
        perGame: new Map(),
        tournaments: new Map(),
      });
    }

    type TournamentLite = {
      id: string;
      name: string;
      game: string;
      startDate: string;
      status: string;
    };
    const ensureTournament = (a: Aggregate, t: TournamentLite): PerTournament => {
      const found = a.tournaments.get(t.id);
      if (found) return found;
      const created: PerTournament = {
        name: t.name,
        game: t.game,
        date: formatDate(t.startDate),
        sort: t.startDate,
        status: t.status,
        wins: 0,
        losses: 0,
        lostRound: null,
        wonFinal: false,
      };
      a.tournaments.set(t.id, created);
      return created;
    };

    // Registrations decide which tournaments show in someone's history.
    for (const p of participants) {
      const a = agg.get(p.team);
      if (!a || p.tournament.tier === "exhibition") continue;
      ensureTournament(a, p.tournament);
    }

    // Completed matches supply wins / losses and per-tournament results.
    for (const m of matches) {
      const t = m.tournament;
      if (t.tier === "exhibition") continue;
      const sides: [string, number, number][] = [
        [m.teamA, m.scoreA as number, m.scoreB as number],
        [m.teamB, m.scoreB as number, m.scoreA as number],
      ];
      for (const [name, own, opp] of sides) {
        const a = agg.get(name);
        if (!a || own === opp) continue;
        const won = own > opp;
        const pt = ensureTournament(a, t);
        if (won) {
          a.wins++;
          pt.wins++;
          if (m.round === "Final") pt.wonFinal = true;
        } else {
          a.losses++;
          pt.losses++;
          pt.lostRound = m.round || pt.lostRound;
        }
        const g = a.perGame.get(t.game) ?? { w: 0, l: 0 };
        if (won) g.w++;
        else g.l++;
        a.perGame.set(t.game, g);
      }
    }

    const players: PublicPlayer[] = [...agg.values()].map((a) => {
      const total = a.wins + a.losses;
      const winRate = total ? Math.round((a.wins / total) * 100) : 0;

      const records = [...a.perGame.entries()]
        .map(([game, r]) => ({ game, w: r.w, l: r.l }))
        .sort((x, y) => y.w + y.l - (x.w + x.l));

      const tournaments = [...a.tournaments.values()]
        // Most recent first, by raw ISO start date.
        .sort((x, y) => (x.sort < y.sort ? 1 : x.sort > y.sort ? -1 : 0))
        .map((t) => ({
          name: t.name,
          game: t.game,
          date: t.date,
          result: resultLabel(t),
        }));

      const championships = [...a.tournaments.values()]
        .filter((t) => t.wonFinal)
        .map((t) => t.name);

      return {
        username: a.username,
        avatarUrl: a.avatarUrl,
        memberSince: a.createdAt.getUTCFullYear(),
        wins: a.wins,
        losses: a.losses,
        winRate,
        trophies: championships.length,
        mainGame: records[0]?.game ?? "",
        records,
        championships,
        tournaments,
      };
    });

    // Strongest first: wins, then win rate, then trophies.
    players.sort(
      (x, y) =>
        y.wins - x.wins || y.winRate - x.winRate || y.trophies - x.trophies,
    );
    return players;
  }
}
