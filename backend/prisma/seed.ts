import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed data mirrors the frontend's mock tournaments so the admin panel starts
// with something to manage. The "fc5" tournament shares its id with the public
// site's ongoing tournament, so scores admins enter here appear on its live page.
type SeedMatch = {
  round: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  status: string;
  playedAt?: string;
};
type SeedRaceResult = {
  session: string; // practice | qualifying | race
  driver: string;
  position?: number;
  lapTime?: string;
};
type SeedTournament = {
  id?: string;
  name: string;
  game: string;
  description: string;
  status: string;
  format: string;
  prizePool: number;
  entryFee: number;
  maxTeams: number;
  startDate: string;
  registrationDeadline: string;
  participants: string[];
  matches: SeedMatch[];
  raceResults?: SeedRaceResult[];
};

const tournaments: SeedTournament[] = [
  {
    id: "fc5",
    name: "MSL Championship S5 — Late Qualifier",
    game: "EA FC",
    description:
      "The flagship EA FC 1v1 championship. Groups A–D, top 2 of each group advance to a single-elimination knockout.",
    status: "ongoing",
    format: "group_knockout",
    prizePool: 5000000,
    entryFee: 50000,
    maxTeams: 16,
    startDate: "2026-07-24",
    registrationDeadline: "2026-07-22",
    participants: [
      "GoalMachine", "DimasFC_99", "ShadowVolt", "TurboTiger",
      "RizkyPratama", "AceHunter", "NitroNina", "BlazeWolf",
      "SpeedKing_ID", "PixelQueen", "FrostShot", "KingRafa",
      "CaptainStrike", "VortexX", "LunaNova", "DriftRider",
    ],
    matches: [
      { round: "Group A", teamA: "GoalMachine", teamB: "ShadowVolt", status: "scheduled", playedAt: "Today · 20:00 WIB" },
      { round: "Group A", teamA: "DimasFC_99", teamB: "TurboTiger", status: "scheduled", playedAt: "Tomorrow · 21:00 WIB" },
      { round: "Group A", teamA: "GoalMachine", teamB: "TurboTiger", scoreA: 2, scoreB: 0, status: "completed", playedAt: "14 Jul" },
      { round: "Group A", teamA: "DimasFC_99", teamB: "ShadowVolt", scoreA: 1, scoreB: 2, status: "completed", playedAt: "13 Jul" },
      { round: "Group B", teamA: "RizkyPratama", teamB: "NitroNina", status: "scheduled", playedAt: "Today · 19:00 WIB" },
      { round: "Group B", teamA: "AceHunter", teamB: "BlazeWolf", status: "scheduled", playedAt: "Tomorrow · 21:00 WIB" },
      { round: "Group B", teamA: "RizkyPratama", teamB: "BlazeWolf", scoreA: 3, scoreB: 1, status: "completed", playedAt: "14 Jul" },
      { round: "Group B", teamA: "AceHunter", teamB: "RizkyPratama", scoreA: 0, scoreB: 2, status: "completed", playedAt: "12 Jul" },
      { round: "Group C", teamA: "SpeedKing_ID", teamB: "FrostShot", status: "scheduled", playedAt: "Tomorrow · 19:00 WIB" },
      { round: "Group C", teamA: "PixelQueen", teamB: "KingRafa", scoreA: 4, scoreB: 2, status: "completed", playedAt: "14 Jul" },
      { round: "Group C", teamA: "SpeedKing_ID", teamB: "PixelQueen", scoreA: 2, scoreB: 1, status: "completed", playedAt: "12 Jul" },
      { round: "Group D", teamA: "CaptainStrike", teamB: "LunaNova", status: "scheduled", playedAt: "Tomorrow · 20:00 WIB" },
      { round: "Group D", teamA: "VortexX", teamB: "DriftRider", scoreA: 1, scoreB: 0, status: "completed", playedAt: "13 Jul" },
      { round: "Group D", teamA: "CaptainStrike", teamB: "VortexX", scoreA: 3, scoreB: 2, status: "completed", playedAt: "12 Jul" },
    ],
  },
  // Tournaments open for registration. Ids match the public site's tournament
  // ids so a registration from the public page lands on the right tournament.
  {
    id: "gp26",
    name: "Grand Prix Series — Sprint Cup",
    game: "Grand Prix",
    description: "Time trial qualifying followed by a sprint race final.",
    status: "ongoing",
    format: "racing",
    prizePool: 3500000,
    entryFee: 35000,
    maxTeams: 24,
    startDate: "2026-07-26",
    registrationDeadline: "2026-07-24",
    participants: [
      "SpeedKing_ID", "NitroNina", "DriftRider", "TurboTiger",
      "VortexX", "RizkyPratama",
    ],
    matches: [],
    raceResults: [
      { session: "practice", driver: "SpeedKing_ID", position: 1, lapTime: "1:31.884" },
      { session: "practice", driver: "NitroNina", position: 2, lapTime: "1:32.120" },
      { session: "practice", driver: "DriftRider", position: 3, lapTime: "1:32.455" },
      { session: "practice", driver: "TurboTiger", position: 4, lapTime: "1:33.002" },
      { session: "practice", driver: "VortexX", position: 5, lapTime: "1:33.418" },
      { session: "practice", driver: "RizkyPratama", position: 6, lapTime: "1:33.760" },
      { session: "qualifying", driver: "NitroNina", position: 1, lapTime: "1:30.902" },
      { session: "qualifying", driver: "SpeedKing_ID", position: 2, lapTime: "1:31.045" },
      { session: "qualifying", driver: "RizkyPratama", position: 3, lapTime: "1:31.612" },
      { session: "qualifying", driver: "DriftRider", position: 4, lapTime: "1:31.998" },
      { session: "qualifying", driver: "VortexX", position: 5, lapTime: "1:32.301" },
      { session: "qualifying", driver: "TurboTiger", position: 6, lapTime: "1:32.744" },
      { session: "race", driver: "SpeedKing_ID", position: 1, lapTime: "1:30.551" },
      { session: "race", driver: "NitroNina", position: 2, lapTime: "1:30.802" },
      { session: "race", driver: "RizkyPratama", position: 3, lapTime: "1:31.207" },
    ],
  },
  {
    id: "sc26",
    name: "Smash Court Open — August Edition",
    game: "Smash Court",
    description: "Round robin group play, then a knockout bracket.",
    status: "open",
    format: "group_knockout",
    prizePool: 2000000,
    entryFee: 25000,
    maxTeams: 16,
    startDate: "2026-08-02",
    registrationDeadline: "2026-07-30",
    participants: [],
    matches: [],
  },
  {
    id: "am26",
    name: "Arcade Clash Cup — Score Attack",
    game: "Arcade Mania",
    description: "Weekly high-score attack. Free entry, open to everyone.",
    status: "open",
    format: "knockout",
    prizePool: 1500000,
    entryFee: 0,
    maxTeams: 64,
    startDate: "2026-07-21",
    registrationDeadline: "2026-07-19",
    participants: [],
    matches: [],
  },
  {
    id: "tb26",
    name: "Turbo Ball Community League S2",
    game: "Turbo Ball",
    description: "3v3 arena league with playoffs for the top 4 teams.",
    status: "open",
    format: "group_knockout",
    prizePool: 2500000,
    entryFee: 30000,
    maxTeams: 16,
    startDate: "2026-08-01",
    registrationDeadline: "2026-07-29",
    participants: [],
    matches: [],
  },
  {
    id: "fl26",
    name: "Fantasy League Cup — Season 4",
    game: "Fantasy League",
    description: "Swiss rounds decide the cup winner.",
    status: "open",
    format: "knockout",
    prizePool: 4000000,
    entryFee: 40000,
    maxTeams: 32,
    startDate: "2026-07-28",
    registrationDeadline: "2026-07-26",
    participants: [],
    matches: [],
  },
  {
    name: "MSL Mobile Legends Season 3",
    game: "Mobile Legends: Bang Bang",
    description:
      "The flagship Mobile Legends tournament of Mabar Super League. Group stage followed by single-elimination playoffs.",
    status: "open",
    format: "group_knockout",
    prizePool: 15000000,
    entryFee: 100000,
    maxTeams: 32,
    startDate: "2026-08-01",
    registrationDeadline: "2026-07-25",
    participants: ["Garuda Esports", "Nusantara Five", "Rajawali Gaming", "Komodo Kings"],
    matches: [
      { round: "Group A", teamA: "Garuda Esports", teamB: "Komodo Kings", scoreA: 2, scoreB: 1, status: "completed" },
      { round: "Group A", teamA: "Nusantara Five", teamB: "Rajawali Gaming", status: "scheduled" },
    ],
  },
  {
    name: "MSL Valorant Community Cup",
    game: "Valorant",
    description:
      "A community-driven Valorant cup for amateur and semi-pro teams. Double elimination, all matches online.",
    status: "open",
    format: "knockout",
    prizePool: 10000000,
    entryFee: 75000,
    maxTeams: 16,
    startDate: "2026-08-08",
    registrationDeadline: "2026-08-01",
    participants: ["Satria Muda", "Benteng Squad", "Cendrawasih X"],
    matches: [
      { round: "Upper R1", teamA: "Satria Muda", teamB: "Benteng Squad", status: "scheduled" },
    ],
  },
  {
    name: "MSL eFootball Open 2026",
    game: "eFootball",
    description:
      "1v1 eFootball tournament over two weekends. Swiss rounds then a top-8 knockout bracket.",
    status: "ongoing",
    format: "group_knockout",
    prizePool: 4000000,
    entryFee: 25000,
    maxTeams: 64,
    startDate: "2026-06-27",
    registrationDeadline: "2026-06-20",
    participants: ["Harimau Legion", "Bima Sakti", "Elang Timur"],
    matches: [
      { round: "Swiss R1", teamA: "Harimau Legion", teamB: "Bima Sakti", scoreA: 2, scoreB: 0, status: "completed" },
    ],
  },
];

async function main() {
  console.log("Resetting tables…");
  await prisma.match.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.tournament.deleteMany();

  for (const t of tournaments) {
    const { participants, matches, raceResults, ...rest } = t;
    const created = await prisma.tournament.create({
      data: {
        ...rest,
        participants: {
          create: participants.map((team) => ({ team, status: "confirmed" })),
        },
        matches: { create: matches },
        ...(raceResults?.length ? { raceResults: { create: raceResults } } : {}),
      },
    });
    console.log(`  + ${created.name} (${participants.length} teams, ${matches.length} matches)`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
