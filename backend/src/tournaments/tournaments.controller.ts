import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { CurrentUser, Public, Roles } from "../auth/auth.decorators";
import type { PublicUser } from "../auth/auth.service";

import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { TournamentsService } from "./tournaments.service";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Public()
  @Get()
  findAll() {
    return this.tournaments.findAll();
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user?: PublicUser) {
    return this.tournaments.findOne(id, user);
  }

  @Roles("admin")
  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournaments.create(dto);
  }

  @Roles("admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTournamentDto) {
    return this.tournaments.update(id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tournaments.remove(id);
  }
}
