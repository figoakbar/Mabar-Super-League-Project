import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateMatchDto {
  @IsString()
  @MinLength(1)
  tournamentId: string;

  @IsString()
  @MinLength(1)
  teamA: string;

  @IsString()
  @MinLength(1)
  teamB: string;

  @IsOptional()
  @IsString()
  round?: string;

  @IsOptional()
  @IsString()
  playedAt?: string;
}

export class UpdateMatchDto {
  @IsOptional()
  @IsString()
  teamA?: string;

  @IsOptional()
  @IsString()
  teamB?: string;

  @IsOptional()
  @IsString()
  round?: string;

  @IsOptional()
  @IsString()
  playedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreA?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreB?: number;

  @IsOptional()
  @IsIn(["scheduled", "completed"])
  status?: string;
}

export class SetScoreDto {
  @IsInt()
  @Min(0)
  scoreA: number;

  @IsInt()
  @Min(0)
  scoreB: number;
}
