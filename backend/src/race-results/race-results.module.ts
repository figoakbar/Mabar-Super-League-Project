import { Module } from "@nestjs/common";

import { RaceResultsController } from "./race-results.controller";
import { RaceResultsService } from "./race-results.service";

@Module({
  controllers: [RaceResultsController],
  providers: [RaceResultsService],
})
export class RaceResultsModule {}
