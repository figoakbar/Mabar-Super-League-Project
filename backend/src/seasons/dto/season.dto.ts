import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class ScheduleSeasonDto {
  // Optional: the service falls back to "Season {n}" when left blank.
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  /** Start date (yyyy-mm-dd or ISO). Defaults to now → the season starts today. */
  @IsOptional()
  @IsDateString()
  startAt?: string;

  /** End date. Omit for an open-ended season that closes only manually. */
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class UpdateSeasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  /** A date to set an end, or null to clear it (make the season open-ended). */
  @IsOptional()
  @ValidateIf((o) => o.endAt !== null)
  @IsDateString()
  endAt?: string | null;
}
