import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

/** One row of a tournament's schedule timeline. */
export class ScheduleItemDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
