import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";

import {
  CreateRaceResultDto,
  UpdateRaceResultDto,
} from "./dto/race-result.dto";
import { RaceResultsService } from "./race-results.service";

@Controller("race-results")
export class RaceResultsController {
  constructor(private readonly raceResults: RaceResultsService) {}

  @Public()
  @Get()
  findAll(
    @Query("tournamentId") tournamentId?: string,
    @Query("session") session?: string,
  ) {
    return this.raceResults.findAll(tournamentId, session);
  }

  @Roles("admin")
  @Post()
  create(@Body() dto: CreateRaceResultDto) {
    return this.raceResults.create(dto);
  }

  @Roles("admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateRaceResultDto) {
    return this.raceResults.update(id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.raceResults.remove(id);
  }
}
