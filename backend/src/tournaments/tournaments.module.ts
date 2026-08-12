import { Module } from "@nestjs/common";

import { SeasonsModule } from "../seasons/seasons.module";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";

@Module({
  // SeasonsModule exports SeasonsService, used to stamp the active season.
  imports: [SeasonsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
