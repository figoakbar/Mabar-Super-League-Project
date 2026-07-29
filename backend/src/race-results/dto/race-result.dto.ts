import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export const SESSIONS = ["practice", "qualifying", "race"] as const;

export class CreateRaceResultDto {
  @IsString()
  @MinLength(1)
  tournamentId: string;

  @IsIn(SESSIONS)
  session: string;

  @IsString()
  @MinLength(1)
  driver: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsString()
  lapTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRaceResultDto {
  @IsOptional()
  @IsIn(SESSIONS)
  session?: string;

  @IsOptional()
  @IsString()
  driver?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsString()
  lapTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
