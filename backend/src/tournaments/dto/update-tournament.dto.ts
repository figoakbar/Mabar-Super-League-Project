import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

import { ScheduleItemDto } from "./schedule-item.dto";

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["open", "closed", "ongoing", "completed"])
  status?: string;

  @IsOptional()
  @IsIn(["knockout", "group_knockout", "racing"])
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prizePool?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTeams?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  registrationDeadline?: string;

  /** When present, replaces the tournament's whole schedule. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedule?: ScheduleItemDto[];
}
