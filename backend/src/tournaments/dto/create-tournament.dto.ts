import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

import { ScheduleItemDto } from "./schedule-item.dto";

export class CreateTournamentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  game: string;

  /** Comma-separated supported platforms, e.g. "PS5, Xbox Series X|S, PC". */
  @IsOptional()
  @IsString()
  platforms?: string;

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
  @IsIn(["minor", "major", "championship", "exhibition"])
  tier?: string;

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

  /** Timeline rows shown on the public tournament page. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedule?: ScheduleItemDto[];
}
