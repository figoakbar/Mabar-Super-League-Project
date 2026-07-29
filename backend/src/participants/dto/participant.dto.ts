import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateParticipantDto {
  @IsString()
  @MinLength(1)
  tournamentId: string;

  // team / captain / status are set from the session by the controller, so a
  // client never has to send them — and anything it does send is overwritten.
  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  captain?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsIn(["pending", "confirmed", "rejected"])
  status?: string;
}

export class UpdateParticipantDto {
  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  captain?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsIn(["pending", "confirmed", "rejected"])
  status?: string;
}
