import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

/** One row on the seasonal leaderboard, ranked by season points. */
export type LeaderboardEntry = {
  username: string;
  avatarUrl: string;
  points: number;
  wins: number;
  losses: number;
  mainGame: string;
  tournaments: number;
};

export type LeaderboardData = {
  season: string;
  seasons: string[];
  players: LeaderboardEntry[];
};

/** Tier weight multiplies the points a placement is worth. */
const TIER_WEIGHT: Record<string, number> = {
  minor: 1,
  major: 2,
  championship: 3,
};

/** Base points for a player's finishing placement in one tournament. */
function placementPoints(
  wonFinal: boolean,
  lostRound: string | null,
  playedAny: boolean,
): number {
  if (wonFinal) return 100; // Champion
  if (lostRound === "Final") return 60; // Runner-up
  if (lostRound === "Semifinals") return 35;
  if (lostRound === "Quarterfinals") return 20;
  if (lostRound === "Round of 16") return 12;
  if (playedAny) return 8; // group stage / earlier exit
  return 3; // confirmed but never played a completed match
}

/** A season is the calendar year the tournament started in. */
function seasonOf(startDate: string, createdAt: Date): string {
  const d = new Date(startDate);
  const year = Number.isNaN(d.getTime())
    ? createdAt.getUTCFullYear()
    : d.getUTCFullYear();
  return String(year);
}

type Agg = {
  points: number;
  wins: number;
  losses: number;
  tournaments: number;
  byGame: Map<string, number>;
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Season points standings. Points come from real placements in completed
   * tournaments (champion / runner-up / …) weighted by the tournament's tier
   * and field size, bucketed by season. Only registered users are ranked.
   */
  async standings(requestedSeason?: string): Promise<LeaderboardData> {
    const [users, tournaments] = await Promise.all([
      this.prisma.user.findMany({
        select: { username: true, avatarUrl: true },
      }),
      this.prisma.tournament.findMany({
        where: { status: "completed" },
        select: {
          game: true,
          tier: true,
          startDate: true,
          createdAt: true,
          participants: {
            where: { status: "confirmed" },
            select: { team: true },
          },
          matches: {
            where: {
              status: "completed",
              scoreA: { not: null },
              scoreB: { not: null },
            },
            select: {
              teamA: true,
              teamB: true,
              scoreA: true,
              scoreB: true,
              round: true,
            },
          },
        },
      }),
    ]);

    const userSet = new Set(users.map((u) => u.username));
    const avatarByName = new Map(users.map((u) => [u.username, u.avatarUrl]));

    const bySeason = new Map<string, Map<string, Agg>>();
    const ensureAgg = (season: string, name: string): Agg => {
      let seasonMap = bySeason.get(season);
      if (!seasonMap) {
        seasonMap = new Map();
        bySeason.set(season, seasonMap);
      }
      let agg = seasonMap.get(name);
      if (!agg) {
        agg = { points: 0, wins: 0, losses: 0, tournaments: 0, byGame: new Map() };
        seasonMap.set(name, agg);
      }
      return agg;
    };

    for (const t of tournaments) {
      // Exhibition tournaments are friendlies — they award no season points.
      if (t.tier === "exhibition") continue;
      const season = seasonOf(t.startDate, t.createdAt);
      const weight = TIER_WEIGHT[t.tier] ?? 1;
      const fieldCount = t.participants.length || 8;
      const fieldMult = Math.min(2, Math.max(1, Math.sqrt(fieldCount / 8)));

      // Per-player placement state within this tournament.
      type PT = {
        wins: number;
        losses: number;
        lostRound: string | null;
        wonFinal: boolean;
        playedAny: boolean;
      };
      const pt = new Map<string, PT>();
      const ensurePT = (name: string): PT => {
        let p = pt.get(name);
        if (!p) {
          p = { wins: 0, losses: 0, lostRound: null, wonFinal: false, playedAny: false };
          pt.set(name, p);
        }
        return p;
      };

      for (const p of t.participants) if (userSet.has(p.team)) ensurePT(p.team);

      for (const m of t.matches) {
        const sides: [string, number, number][] = [
          [m.teamA, m.scoreA as number, m.scoreB as number],
          [m.teamB, m.scoreB as number, m.scoreA as number],
        ];
        for (const [name, own, opp] of sides) {
          if (!userSet.has(name) || own === opp) continue;
          const p = ensurePT(name);
          p.playedAny = true;
          if (own > opp) {
            p.wins++;
            if (m.round === "Final") p.wonFinal = true;
          } else {
            p.losses++;
            p.lostRound = m.round || p.lostRound;
          }
        }
      }

      for (const [name, p] of pt) {
        const sp = Math.round(
          placementPoints(p.wonFinal, p.lostRound, p.playedAny) *
            weight *
            fieldMult,
        );
        const agg = ensureAgg(season, name);
        agg.points += sp;
        agg.wins += p.wins;
        agg.losses += p.losses;
        agg.tournaments += 1;
        agg.byGame.set(t.game, (agg.byGame.get(t.game) ?? 0) + sp);
      }
    }

    const seasons = [...bySeason.keys()].sort().reverse();
    const currentYear = String(new Date().getUTCFullYear());
    const season =
      requestedSeason && bySeason.has(requestedSeason)
        ? requestedSeason
        : bySeason.has(currentYear)
          ? currentYear
          : (seasons[0] ?? currentYear);

    const seasonMap = bySeason.get(season) ?? new Map<string, Agg>();
    const players: LeaderboardEntry[] = [...seasonMap.entries()].map(
      ([name, a]) => {
        let mainGame = "";
        let best = -1;
        for (const [g, sp] of a.byGame) {
          if (sp > best) {
            best = sp;
            mainGame = g;
          }
        }
        return {
          username: name,
          avatarUrl: avatarByName.get(name) ?? "",
          points: a.points,
          wins: a.wins,
          losses: a.losses,
          mainGame,
          tournaments: a.tournaments,
        };
      },
    );
    players.sort(
      (x, y) =>
        y.points - x.points ||
        y.wins - x.wins ||
        x.username.localeCompare(y.username),
    );

    return { season, seasons: seasons.length ? seasons : [currentYear], players };
  }
}
