import { Injectable } from "@nestjs/common";

import { SeasonsService } from "../seasons/seasons.service";
import { PrismaService } from "../prisma/prisma.service";
import { type LeaderboardEntry } from "./standings.util";

export type { LeaderboardEntry };

/** A season as the leaderboard needs to label and pick between them. */
export type SeasonMeta = { id: string; name: string; status: string };

export type LeaderboardData = {
  /** The selected season's id, or "" when no season exists yet. */
  season: string;
  seasonName: string;
  seasons: SeasonMeta[];
  /** The game the standings are filtered to, or "" for all games combined. */
  game: string;
  /** Games that have season points in the selected season. */
  games: string[];
  players: LeaderboardEntry[];
};

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasons: SeasonsService,
  ) {}

  /**
   * Season points standings for one season. Points are bucketed by `seasonId`;
   * seasons are real records started/closed by an admin (or by date). Standings
   * can be filtered to a single game.
   */
  async standings(
    requestedSeason?: string,
    requestedGame?: string,
  ): Promise<LeaderboardData> {
    // Flip any season whose start/end date has passed before reading.
    await this.seasons.reconcile();

    const seasons = await this.prisma.season.findMany({
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, status: true },
    });

    // Target season: a valid request → the active one → the newest.
    const requested =
      requestedSeason && seasons.some((s) => s.id === requestedSeason)
        ? requestedSeason
        : undefined;
    const active = seasons.find((s) => s.status === "active");
    const target = requested ?? active?.id ?? seasons[0]?.id ?? "";

    if (!target) {
      return {
        season: "",
        seasonName: "",
        seasons,
        game: "",
        games: [],
        players: [],
      };
    }

    const standings = await this.seasons.computeSeasonStandings(target);
    const games = [...standings.byGame.keys()].sort();
    const game =
      requestedGame && standings.byGame.has(requestedGame) ? requestedGame : "";
    const players = game ? (standings.byGame.get(game) ?? []) : standings.overall;
    const seasonName = seasons.find((s) => s.id === target)?.name ?? "";

    return { season: target, seasonName, seasons, game, games, players };
  }
}
