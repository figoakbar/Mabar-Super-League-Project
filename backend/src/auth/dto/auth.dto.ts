import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

/** Usernames are used in URLs and participant rows, so keep them tame. */
const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;
const USERNAME_MESSAGE = "username may only contain letters, numbers, _ . and -";

/**
 * A verified identity handed over by the Next.js server after it has completed
 * the OAuth dance with Google or Discord. The same shape serves both providers;
 * the route decides which id column it binds to.
 */
export class OAuthProfileDto {
  @IsString()
  @MaxLength(200)
  providerId: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

/** Fields a signed-in user may change about themselves. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_RE, { message: USERNAME_MESSAGE })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  consoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pcId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;
}

/**
 * The mandatory first-sign-in step. Deliberately its own class rather than a
 * subclass of UpdateProfileDto: class-validator inherits `@IsOptional`, and
 * here username, phone and consent are required.
 */
export class CompleteProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_RE, { message: USERNAME_MESSAGE })
  username: string;

  @IsString()
  @IsNotEmpty({ message: "phone number is required" })
  @MaxLength(40)
  phone: string;

  /** Empty is allowed here; the service requires at least one of the two. */
  @IsString()
  @MaxLength(200)
  consoleId: string;

  @IsString()
  @MaxLength(200)
  pcId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @IsBoolean()
  @Equals(true, {
    message: "you must accept the Terms and Privacy Policy to continue",
  })
  agree: boolean;
}
