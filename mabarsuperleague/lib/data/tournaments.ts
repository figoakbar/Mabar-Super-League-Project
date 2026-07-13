import type { Tournament } from "@/lib/types";

export const tournaments: Tournament[] = [
  {
    id: "msl-mlbb-s3",
    name: "MSL Mobile Legends Season 3",
    game: "Mobile Legends: Bang Bang",
    description:
      "The flagship Mobile Legends tournament of Mabar Super League. Squads from all over Indonesia compete in a group stage followed by single-elimination playoffs.",
    status: "open",
    format: "5v5 — Group Stage + Single Elimination",
    prizePool: 15000000,
    entryFee: 100000,
    maxTeams: 32,
    registeredTeams: 21,
    startDate: "2026-08-01",
    registrationDeadline: "2026-07-25",
    location: "Online (Grand Final: Jakarta)",
    rules: [
      "All players must be registered before the deadline.",
      "Rosters are locked once the group stage begins.",
      "Matches are best of 3; the grand final is best of 5.",
      "Unsportsmanlike conduct leads to disqualification.",
    ],
    schedule: [
      { stage: "Registration closes", date: "2026-07-25" },
      { stage: "Group stage", date: "2026-08-01" },
      { stage: "Playoffs", date: "2026-08-15" },
      { stage: "Grand final", date: "2026-08-22" },
    ],
  },
  {
    id: "msl-valorant-cup",
    name: "MSL Valorant Community Cup",
    game: "Valorant",
    description:
      "A community-driven Valorant cup for amateur and semi-pro teams. Double elimination bracket, all matches played online.",
    status: "open",
    format: "5v5 — Double Elimination",
    prizePool: 10000000,
    entryFee: 75000,
    maxTeams: 16,
    registeredTeams: 9,
    startDate: "2026-08-08",
    registrationDeadline: "2026-08-01",
    location: "Online",
    rules: [
      "Teams may register up to 2 substitutes.",
      "All matches are best of 1 until the semifinals.",
      "Semifinals and finals are best of 3.",
      "Smurfing or account sharing is strictly prohibited.",
    ],
    schedule: [
      { stage: "Registration closes", date: "2026-08-01" },
      { stage: "Upper bracket round 1", date: "2026-08-08" },
      { stage: "Finals", date: "2026-08-16" },
    ],
  },
  {
    id: "msl-pubgm-showdown",
    name: "MSL PUBG Mobile Showdown",
    game: "PUBG Mobile",
    description:
      "Squad battle royale across 6 matches on Erangel and Miramar. Points are awarded for placement and eliminations.",
    status: "open",
    format: "Squad — 6 Match Point System",
    prizePool: 8000000,
    entryFee: 50000,
    maxTeams: 24,
    registeredTeams: 24,
    startDate: "2026-07-19",
    registrationDeadline: "2026-07-15",
    location: "Online",
    rules: [
      "Emulator players are not allowed.",
      "Placement points follow the official PMPL system.",
      "Teams must join the lobby 15 minutes before each match.",
    ],
    schedule: [
      { stage: "Registration closes", date: "2026-07-15" },
      { stage: "Match day 1 (3 matches)", date: "2026-07-19" },
      { stage: "Match day 2 (3 matches)", date: "2026-07-20" },
    ],
  },
  {
    id: "msl-ff-blitz",
    name: "MSL Free Fire Blitz",
    game: "Free Fire",
    description:
      "Fast-paced Free Fire tournament for squads. One-day event with 4 qualifying matches and a final round.",
    status: "open",
    format: "Squad — Qualifier + Final",
    prizePool: 5000000,
    entryFee: 0,
    maxTeams: 48,
    registeredTeams: 30,
    startDate: "2026-08-02",
    registrationDeadline: "2026-07-30",
    location: "Online",
    rules: [
      "Free entry, one squad per registered account.",
      "Top 12 squads from qualifiers advance to the final.",
      "Any use of cheats results in a permanent league ban.",
    ],
    schedule: [
      { stage: "Registration closes", date: "2026-07-30" },
      { stage: "Qualifiers", date: "2026-08-02" },
      { stage: "Final round", date: "2026-08-02" },
    ],
  },
  {
    id: "msl-efootball-open",
    name: "MSL eFootball Open 2026",
    game: "eFootball",
    description:
      "1v1 eFootball tournament played over two weekends. Swiss rounds followed by a top-8 knockout bracket.",
    status: "ongoing",
    format: "1v1 — Swiss + Top 8 Knockout",
    prizePool: 4000000,
    entryFee: 25000,
    maxTeams: 64,
    registeredTeams: 64,
    startDate: "2026-06-27",
    registrationDeadline: "2026-06-20",
    location: "Online",
    rules: [
      "Standard 10-minute match settings.",
      "Disconnections are replayed once per match.",
    ],
    schedule: [
      { stage: "Swiss rounds", date: "2026-06-27" },
      { stage: "Top 8 knockout", date: "2026-07-11" },
    ],
  },
  {
    id: "msl-dota2-invitational",
    name: "MSL Dota 2 Invitational",
    game: "Dota 2",
    description:
      "Invitational tournament featuring the top 8 teams from last season's leaderboard.",
    status: "completed",
    format: "5v5 — Round Robin + Playoffs",
    prizePool: 20000000,
    entryFee: 0,
    maxTeams: 8,
    registeredTeams: 8,
    startDate: "2026-05-09",
    registrationDeadline: "2026-05-01",
    location: "Bandung",
    rules: [
      "Invite only — no open registration.",
      "All matches are best of 3; the grand final is best of 5.",
    ],
    schedule: [
      { stage: "Round robin", date: "2026-05-09" },
      { stage: "Playoffs", date: "2026-05-23" },
      { stage: "Grand final", date: "2026-05-30" },
    ],
  },
];

export function getOpenTournaments(): Tournament[] {
  return tournaments.filter((t) => t.status === "open");
}

export function getTournamentById(id: string): Tournament | undefined {
  return tournaments.find((t) => t.id === id);
}
