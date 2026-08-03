/**
 * Non-destructive seed for the public Players directory.
 *
 * Unlike prisma/seed.ts (which wipes and rebuilds everything), this script only
 * ADDS data and is safe to re-run: users are matched by email/username and
 * tournaments by name, so existing rows are left untouched.
 *
 * It creates a batch of real user accounts (all sharing one password, for easy
 * testing) plus a handful of *completed* knockout tournaments, so the Players
 * page has genuine match history to derive wins / losses / trophies from.
 *
 *   Run from the backend/ directory:  npx ts-node prisma/seed-players.ts
 */
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/auth/crypto.util";

const prisma = new PrismaClient();

/** One shared password for every seeded account — for local testing only. */
const PASSWORD = "MabarLeague2026";

const USERNAMES = [
  "RendiPratama",
  "AyuLestari",
  "BagusWijaya",
  "CitraDewi",
  "DimasArya",
  "EkaSaputra",
  "FajarNugroho",
  "GitaRahayu",
  "HendraGunawan",
  "IndahPermata",
  "JokoSusilo",
  "KiranaMaharani",
  "LuthfiHakim",
  "MayaAnggraini",
  "NandoPratomo",
  "OktaViana",
  "PutraRamadhan",
  "QoriAndini",
  "RizalFauzi",
  "SintaWulandari",
  "TegarPangestu",
  "UmiKalsum",
  "ValdoSitanggang",
  "WahyuHidayat",
];

// --- tiny deterministic RNG so re-runs would produce the same bracket ---------
function hashString(s: string): number {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bracket-round label for a round that has `n` players in it. */
function knockoutRoundName(n: number): string {
  if (n === 2) return "Final";
  if (n === 4) return "Semifinals";
  if (n === 8) return "Quarterfinals";
  if (n === 16) return "Round of 16";
  return `Round of ${n}`;
}

type TournamentDef = {
  name: string;
  game: string;
  startDate: string; // ISO date; formatted for display by the API
  roster: string[]; // usernames, power-of-two length
};

async function ensureUser(username: string, createdAt: Date): Promise<void> {
  const email = `${username.toLowerCase()}@mabar.test`;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (existing) return;
  await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: await hashPassword(PASSWORD),
      role: "user",
      createdAt,
    },
  });
}

async function ensureTournament(def: TournamentDef): Promise<string> {
  const existing = await prisma.tournament.findFirst({
    where: { name: def.name },
    select: { id: true },
  });
  if (existing) {
    console.log(`  · skip (exists): ${def.name}`);
    return "skipped";
  }

  const t = await prisma.tournament.create({
    data: {
      name: def.name,
      game: def.game,
      description: `${def.game} single-elimination — a past MSL season.`,
      status: "completed",
      format: "knockout",
      prizePool: 5_000_000,
      entryFee: 50_000,
      maxTeams: def.roster.length,
      startDate: def.startDate,
      registrationDeadline: def.startDate,
    },
  });

  // Confirmed participants.
  for (const team of def.roster) {
    await prisma.participant.create({
      data: {
        team,
        captain: team,
        status: "confirmed",
        reviewedAt: new Date(def.startDate),
        tournamentId: t.id,
      },
    });
  }

  // Simulate the bracket: winners advance, no ties, varied scores.
  const rand = mulberry32(hashString(def.name));
  let round = [...def.roster];
  let champion = round[0];
  while (round.length > 1) {
    const label = knockoutRoundName(round.length);
    const next: string[] = [];
    for (let i = 0; i < round.length; i += 2) {
      const a = round[i];
      const b = round[i + 1];
      const aWins = rand() < 0.5;
      const loserScore = Math.floor(rand() * 3); // 0..2
      const winnerScore = loserScore + 1 + Math.floor(rand() * 2); // +1..+2
      const scoreA = aWins ? winnerScore : loserScore;
      const scoreB = aWins ? loserScore : winnerScore;
      await prisma.match.create({
        data: {
          round: label,
          teamA: a,
          teamB: b,
          scoreA,
          scoreB,
          status: "completed",
          playedAt: def.startDate,
          tournamentId: t.id,
        },
      });
      next.push(aWins ? a : b);
    }
    round = next;
    champion = round[0];
  }
  console.log(`  ✓ ${def.name} — champion: ${champion}`);
  return t.id;
}

async function main() {
  console.log("Seeding player accounts…");
  const rand = mulberry32(hashString("members"));
  for (const username of USERNAMES) {
    // Vary "member since" across 2023–2025.
    const year = 2023 + Math.floor(rand() * 3);
    const month = Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 27);
    await ensureUser(username, new Date(year, month, day));
  }
  console.log(`  ✓ ${USERNAMES.length} accounts ensured\n`);

  const u = USERNAMES;
  const tournaments: TournamentDef[] = [
    { name: "MSL EA FC Cup S1", game: "EA FC", startDate: "2025-04-12", roster: u.slice(0, 8) },
    { name: "MSL Grand Prix Trophy 2025", game: "Grand Prix", startDate: "2025-07-05", roster: u.slice(4, 12) },
    { name: "MSL Arcade Masters 2025", game: "Arcade Mania", startDate: "2025-10-18", roster: u.slice(8, 16) },
    { name: "MSL Fantasy League Cup 2026", game: "Fantasy League", startDate: "2026-01-24", roster: u.slice(12, 20) },
    { name: "MSL Smash Court Open 2026", game: "Smash Court", startDate: "2026-03-14", roster: u.slice(16, 24) },
    {
      // Includes the platform owner so the signed-in admin also has stats.
      name: "MSL Champions Invitational 2026",
      game: "EA FC",
      startDate: "2026-06-20",
      roster: ["figoakbar", u[0], u[5], u[9], u[13], u[17], u[21], u[2]],
    },
  ];

  console.log("Seeding completed tournaments…");
  for (const def of tournaments) await ensureTournament(def);

  console.log("\nDone. Shared password for all seeded accounts:", PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
