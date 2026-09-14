import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { diskStorage } from "multer";

import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "./auth.decorators";
import type { PublicUser } from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { rateLimit } from "./rate-limit";

/** Avatars are images only — no PDFs, and no SVG (it can carry script). */
const AVATAR_TYPES = /^image\/(jpeg|png|webp|gif)$/;

const MINUTE = 60_000;

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip ?? "unknown";
}

function guard(key: string, limit: number, windowMs: number) {
  const { allowed, retryAfterSeconds } = rateLimit(key, limit, windowMs);
  if (!allowed) {
    throw new HttpException(
      `Too many attempts. Try again in ${retryAfterSeconds}s.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function bearer(req: Request): string {
  const [scheme, value] = (req.headers.authorization ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    throw new BadRequestException("Missing bearer token");
  }
  return value.trim();
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    guard(`register:${clientIp(req)}`, 10, 15 * MINUTE);
    return this.auth.register(dto, req.headers["user-agent"]);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() dto: LoginDto, @Req() req: Request) {
    // Limit per IP and per account so neither a single source nor a single
    // target can be hammered.
    guard(`login-ip:${clientIp(req)}`, 20, 15 * MINUTE);
    guard(`login-user:${dto.email.trim().toLowerCase()}`, 8, 15 * MINUTE);
    return this.auth.login(dto, req.headers["user-agent"]);
  }

  /**
   * Server-to-server: the Next.js server verifies the Google ID token, then
   * calls this with the verified profile. Protected by INTERNAL_API_KEY so a
   * browser cannot forge a "Google" identity.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("google")
  google(@Body() dto: GoogleLoginDto, @Req() req: Request) {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.headers["x-internal-key"];
    if (!expected || provided !== expected) {
      throw new ForbiddenException("Invalid internal key");
    }
    return this.auth.loginWithGoogle(dto, req.headers["user-agent"]);
  }

  @Get("me")
  me(@Req() req: Request) {
    return this.auth.me(bearer(req));
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  logout(@Req() req: Request) {
    return this.auth.logout(bearer(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  forgot(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    guard(`forgot-ip:${clientIp(req)}`, 6, 15 * MINUTE);
    guard(`forgot-user:${dto.email.trim().toLowerCase()}`, 3, 15 * MINUTE);
    const base = process.env.APP_URL ?? "http://localhost:3000";
    return this.auth.forgotPassword(dto, base);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  reset(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    guard(`reset:${clientIp(req)}`, 10, 15 * MINUTE);
    return this.auth.resetPassword(dto);
  }

  /** Convenience for the frontend: who am I, resolved from the guard. */
  @Get("session")
  session(@CurrentUser() user?: PublicUser) {
    return { user };
  }

  /** Edit your own profile. The id comes from the session, never the body. */
  @Patch("me")
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.auth.updateProfile(user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("me/password")
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: PublicUser,
    @Req() req: Request,
  ) {
    guard(`change-pw:${clientIp(req)}`, 10, 15 * MINUTE);
    return this.auth.changePassword(user.id, dto);
  }

  /** Upload a profile picture (JPG/PNG/WEBP/GIF, max 2 MB). */
  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) =>
          cb(
            null,
            `avatar-${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          ),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        AVATAR_TYPES.test(file.mimetype)
          ? cb(null, true)
          : cb(new BadRequestException("Only JPG, PNG, WEBP or GIF"), false),
    }),
  )
  uploadAvatar(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.auth.setAvatar(user.id, `/uploads/${file.filename}`);
  }

  @Delete("me/avatar")
  removeAvatar(@CurrentUser() user: PublicUser) {
    return this.auth.removeAvatar(user.id);
  }
}
