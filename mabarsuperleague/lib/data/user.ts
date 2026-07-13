import type { UserProfile } from "@/lib/types";

export const currentUser: UserProfile = {
  id: "u-001",
  username: "figoakbar",
  fullName: "Figo Akbar",
  email: "figoakbar15@gmail.com",
  team: "Garuda Esports",
  joinedAt: "2025-11-12",
  stats: {
    tournamentsJoined: 9,
    wins: 38,
    losses: 7,
    points: 2450,
  },
  matchHistory: [
    {
      id: "m-101",
      tournament: "MSL eFootball Open 2026",
      opponent: "Komodo Kings",
      result: "win",
      score: "2 - 1",
      date: "2026-07-04",
    },
    {
      id: "m-100",
      tournament: "MSL eFootball Open 2026",
      opponent: "Satria Muda",
      result: "win",
      score: "2 - 0",
      date: "2026-06-28",
    },
    {
      id: "m-099",
      tournament: "MSL Dota 2 Invitational",
      opponent: "Nusantara Five",
      result: "loss",
      score: "1 - 2",
      date: "2026-05-30",
    },
    {
      id: "m-098",
      tournament: "MSL Dota 2 Invitational",
      opponent: "Rajawali Gaming",
      result: "win",
      score: "2 - 0",
      date: "2026-05-23",
    },
    {
      id: "m-097",
      tournament: "MSL Dota 2 Invitational",
      opponent: "Benteng Squad",
      result: "win",
      score: "2 - 1",
      date: "2026-05-09",
    },
  ],
};
