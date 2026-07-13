export type TournamentStatus = "open" | "ongoing" | "completed";

export interface Tournament {
  id: string;
  name: string;
  game: string;
  description: string;
  status: TournamentStatus;
  format: string;
  prizePool: number;
  entryFee: number;
  maxTeams: number;
  registeredTeams: number;
  startDate: string;
  registrationDeadline: string;
  location: string;
  rules: string[];
  schedule: { stage: string; date: string }[];
}

export interface LeaderboardEntry {
  rank: number;
  team: string;
  points: number;
  wins: number;
  losses: number;
  tournamentsPlayed: number;
}

export interface MatchHistory {
  id: string;
  tournament: string;
  opponent: string;
  result: "win" | "loss";
  score: string;
  date: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  team: string;
  joinedAt: string;
  stats: {
    tournamentsJoined: number;
    wins: number;
    losses: number;
    points: number;
  };
  matchHistory: MatchHistory[];
}
