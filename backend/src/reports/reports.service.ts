import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

/** One month of activity. Money is in rupiah. */
export type MonthlyRow = {
  /** "YYYY-MM" */
  key: string;
  tournaments: number;
  participantsConfirmed: number;
  participantsPending: number;
  /** Entry fees actually collected (confirmed registrations only). */
  revenue: number;
  /** Prize money committed by the tournaments running that month. */
  prizePool: number;
  /** revenue − prizePool. Negative means the month is subsidised. */
  net: number;
};

export type GameRow = {
  game: string;
  tournaments: number;
  participants: number;
  revenue: number;
  prizePool: number;
};

/**
 * Everything is grouped by the month a tournament *starts*, not when the row was
 * created: a league is reported on by the season it runs in, and creation dates
 * bunch up whenever data is seeded or imported. Keeping one basis for every
 * metric is what makes the columns add up against each other.
 */
function monthKey(dateish: string): string | null {
  if (!dateish) return null;
  const d = new Date(dateish);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async monthly() {
    const [tournaments, participants, users] = await Promise.all([
      this.prisma.tournament.findMany(),
      this.prisma.participant.findMany({
        include: { tournament: { select: { startDate: true, entryFee: true, game: true } } },
      }),
      this.prisma.user.count(),
    ]);

    const rows = new Map<string, MonthlyRow>();
    const row = (key: string): MonthlyRow => {
      if (!rows.has(key)) {
        rows.set(key, {
          key,
          tournaments: 0,
          participantsConfirmed: 0,
          participantsPending: 0,
          revenue: 0,
          prizePool: 0,
          net: 0,
        });
      }
      return rows.get(key)!;
    };

    for (const t of tournaments) {
      const key = monthKey(t.startDate);
      if (!key) continue;
      const r = row(key);
      r.tournaments += 1;
      r.prizePool += t.prizePool;
    }

    for (const p of participants) {
      const key = monthKey(p.tournament?.startDate ?? "");
      if (!key) continue;
      const r = row(key);
      if (p.status === "confirmed") {
        r.participantsConfirmed += 1;
        // Only a verified payment counts as money in.
        r.revenue += p.tournament?.entryFee ?? 0;
      } else if (p.status === "pending") {
        r.participantsPending += 1;
      }
    }

    const months = [...rows.values()]
      .map((r) => ({ ...r, net: r.revenue - r.prizePool }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // Per-game totals, biggest earner first.
    const gameMap = new Map<string, GameRow>();
    const gameRow = (game: string): GameRow => {
      if (!gameMap.has(game)) {
        gameMap.set(game, { game, tournaments: 0, participants: 0, revenue: 0, prizePool: 0 });
      }
      return gameMap.get(game)!;
    };
    for (const t of tournaments) {
      const g = gameRow(t.game || "Unknown");
      g.tournaments += 1;
      g.prizePool += t.prizePool;
    }
    for (const p of participants) {
      if (p.status !== "confirmed") continue;
      const g = gameRow(p.tournament?.game || "Unknown");
      g.participants += 1;
      g.revenue += p.tournament?.entryFee ?? 0;
    }
    const byGame = [...gameMap.values()].sort((a, b) => b.revenue - a.revenue);

    // Current state, not tied to a month: what still needs an admin's attention.
    const pending = participants.filter((p) => p.status === "pending");
    const outstanding = {
      pendingReview: pending.length,
      pendingValue: pending.reduce(
        (sum, p) => sum + (p.tournament?.entryFee ?? 0),
        0,
      ),
    };

    const totals = months.reduce(
      (acc, m) => ({
        tournaments: acc.tournaments + m.tournaments,
        participantsConfirmed: acc.participantsConfirmed + m.participantsConfirmed,
        participantsPending: acc.participantsPending + m.participantsPending,
        revenue: acc.revenue + m.revenue,
        prizePool: acc.prizePool + m.prizePool,
        net: acc.net + m.net,
      }),
      {
        tournaments: 0,
        participantsConfirmed: 0,
        participantsPending: 0,
        revenue: 0,
        prizePool: 0,
        net: 0,
      },
    );

    return { months, byGame, totals, outstanding, users };
  }
}
