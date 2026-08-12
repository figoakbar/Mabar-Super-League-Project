import { Module } from "@nestjs/common";

import { SeasonsModule } from "../seasons/seasons.module";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";

@Module({
  // SeasonsModule provides reconcile() + season standings for the leaderboard.
  imports: [SeasonsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
