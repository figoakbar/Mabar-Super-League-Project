import { Module } from "@nestjs/common";

import { SeasonsController } from "./seasons.controller";
import { SeasonsService } from "./seasons.service";

@Module({
  controllers: [SeasonsController],
  providers: [SeasonsService],
  // Exported for TournamentsService (active-season stamping) and
  // LeaderboardService (reconcile + season standings).
  exports: [SeasonsService],
})
export class SeasonsModule {}
