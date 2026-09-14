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
  CreateMatchDto,
  GenerateDrawDto,
  SetScoreDto,
  UpdateMatchDto,
} from "./dto/match.dto";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Public()
  @Get()
  findAll(@Query("tournamentId") tournamentId?: string) {
    return this.matches.findAll(tournamentId);
  }

  /** Shuffle confirmed participants into a fresh ladder / group draw. */
  @Roles("admin")
  @Post("generate")
  generate(@Body() dto: GenerateDrawDto) {
    return this.matches.generateDraw(dto.tournamentId);
  }

  @Roles("admin")
  @Post()
  create(@Body() dto: CreateMatchDto) {
    return this.matches.create(dto);
  }

  @Roles("admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMatchDto) {
    return this.matches.update(id, dto);
  }

  @Roles("admin")
  @Patch(":id/score")
  setScore(@Param("id") id: string, @Body() dto: SetScoreDto) {
    return this.matches.setScore(id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.matches.remove(id);
  }
}
