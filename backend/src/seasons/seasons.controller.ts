import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { ScheduleSeasonDto, UpdateSeasonDto } from "./dto/season.dto";
import { SeasonsService } from "./seasons.service";

/** A bare "yyyy-mm-dd" is anchored to the start of that UTC day. */
function toStart(s?: string): Date | undefined {
  if (!s) return undefined;
  return new Date(s.length === 10 ? `${s}T00:00:00.000Z` : s);
}

/** A bare "yyyy-mm-dd" end date is inclusive — anchored to the end of that day.
 *  `undefined` means "no change"; `null`/"" means "clear the end (open-ended)". */
function toEnd(s?: string | null): Date | null | undefined {
  if (s === undefined) return undefined;
  if (!s) return null;
  return new Date(s.length === 10 ? `${s}T23:59:59.999Z` : s);
}

@Controller("seasons")
export class SeasonsController {
  constructor(private readonly seasons: SeasonsService) {}

  @Public()
  @Get()
  list() {
    return this.seasons.list();
  }

  /** Create/schedule a season for a chosen window (defaults to starting today). */
  @Roles("admin")
  @Post()
  schedule(@Body() dto: ScheduleSeasonDto) {
    return this.seasons.schedule(dto.name, toStart(dto.startAt), toEnd(dto.endAt));
  }

  /** Close the season now without opening another. */
  @Roles("admin")
  @Post(":id/close")
  close(@Param("id") id: string) {
    return this.seasons.close(id);
  }

  /** Refresh a closed season's champion snapshot. */
  @Roles("admin")
  @Post(":id/champions")
  recompute(@Param("id") id: string) {
    return this.seasons.recomputeChampions(id);
  }

  /** Edit a season's name and/or dates. */
  @Roles("admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSeasonDto) {
    return this.seasons.updateDates(id, {
      name: dto.name,
      startAt: toStart(dto.startAt),
      endAt: toEnd(dto.endAt),
    });
  }
}
