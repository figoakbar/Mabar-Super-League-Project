import { Controller, Get, Query } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { LeaderboardService } from "./leaderboard.service";

/** Public seasonal leaderboard, ranked by season points. */
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Public()
  @Get()
  standings(@Query("season") season?: string) {
    return this.leaderboard.standings(season);
  }
}
