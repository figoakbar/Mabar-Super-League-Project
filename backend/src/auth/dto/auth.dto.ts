import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

/** Usernames are used in URLs and participant rows, so keep them tame. */
const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

export class RegisterDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_RE, {
    message: "username may only contain letters, numbers, _ . and -",
  })
  username: string;

  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  @MaxLength(200)
  password: string;

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

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MaxLength(200)
  password: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(200)
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  token: string;

  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  @MaxLength(200)
  password: string;
}

/** Fields a signed-in user may change about themselves. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_RE, {
    message: "username may only contain letters, numbers, _ . and -",
  })
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

export class ChangePasswordDto {
  /** Omitted only when the account has no password yet (Google-only sign-up). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: "password must be at least 8 characters" })
  @MaxLength(200)
  newPassword: string;
}

/** Sent by the Next.js server after it has verified a Google ID token. */
export class GoogleLoginDto {
  @IsString()
  @MaxLength(200)
  googleId: string;

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
