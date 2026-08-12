/**
 * One-off migration: turn the old implicit calendar-year seasons into real
 * Season records so the leaderboard keeps showing exactly the same standings,
 * now under manual (admin) control.
 *
 * For each distinct year among existing tournaments it creates a "Season {year}"
 * (the newest year active, older years closed), assigns every tournament to its
 * year's season, and snapshots champions for the closed seasons.
 *
 * Idempotent: does nothing if any Season already exists. Run once:
 *   npx ts-node scripts/backfill-seasons.ts
 */
import { PrismaClient } from "@prisma/client";

import {
  aggregateSeason,
  type StandingsTournament,
} from "../src/leaderboard/standings.util";

const prisma = new PrismaClient();

/** Same rule the old leaderboard used: the year the tournament started in. */
function yearOf(startDate: string, createdAt: Date): string {
  const d = new Date(startDate);
  return String(
    Number.isNaN(d.getTime()) ? createdAt.getUTCFullYear() : d.getUTCFullYear(),
  );
}

async function main() {
  const existing = await prisma.season.count();
  if (existing > 0) {
    console.log(`Seasons already exist (${existing}) — skipping backfill.`);
    return;
  }

  const tournaments = await prisma.tournament.findMany({
    select: { id: true, startDate: true, createdAt: true },
  });
  if (tournaments.length === 0) {
    console.log("No tournaments found — nothing to backfill.");
    return;
  }

  // Bucket tournament ids by year.
  const byYear = new Map<string, string[]>();
  for (const t of tournaments) {
    const y = yearOf(t.startDate, t.createdAt);
    const list = byYear.get(y) ?? [];
    list.push(t.id);
    byYear.set(y, list);
  }
  const years = [...byYear.keys()].sort(); // ascending; newest is last
  const latest = years[years.length - 1];

  // Create one season per year and assign its tournaments.
  const seasonByYear = new Map<string, string>();
  for (const year of years) {
    const isActive = year === latest;
    const season = await prisma.season.create({
      data: {
        name: `Season ${year}`,
        status: isActive ? "active" : "closed",
        startedAt: new Date(`${year}-01-01T00:00:00.000Z`),
        endedAt: isActive ? null : new Date(`${year}-12-31T23:59:59.000Z`),
      },
    });
    seasonByYear.set(year, season.id);
    await prisma.tournament.updateMany({
      where: { id: { in: byYear.get(year)! } },
      data: { seasonId: season.id },
    });
    console.log(
      `Season ${year} (${isActive ? "active" : "closed"}) ← ${byYear.get(year)!.length} tournaments`,
    );
  }

  // Snapshot champions for the closed (past) seasons — the active one is frozen
  // only when an admin eventually closes it.
  const users = await prisma.user.findMany({
    select: { username: true, avatarUrl: true },
  });
  const userSet = new Set(users.map((u) => u.username));
  const avatarByName = new Map(users.map((u) => [u.username, u.avatarUrl]));

  for (const year of years) {
    if (year === latest) continue;
    const seasonId = seasonByYear.get(year)!;
    const completed = await prisma.tournament.findMany({
      where: { status: "completed", seasonId },
      select: {
        game: true,
        tier: true,
        participants: { where: { status: "confirmed" }, select: { team: true } },
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
    });

    const { overall, byGame } = aggregateSeason(
      completed as StandingsTournament[],
      userSet,
      avatarByName,
    );
    const rows: {
      seasonId: string;
      game: string;
      username: string;
      points: number;
    }[] = [];
    if (overall[0])
      rows.push({
        seasonId,
        game: "",
        username: overall[0].username,
        points: overall[0].points,
      });
    for (const [game, list] of byGame)
      if (list[0])
        rows.push({
          seasonId,
          game,
          username: list[0].username,
          points: list[0].points,
        });

    if (rows.length) {
      await prisma.seasonChampion.createMany({ data: rows });
      console.log(
        `  ${year} champions: ` +
          rows
            .map((r) => `${r.game || "OVERALL"}=${r.username}(${r.points})`)
            .join(", "),
      );
    }
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
