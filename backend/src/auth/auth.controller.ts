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
  CompleteProfileDto,
  OAuthProfileDto,
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

/**
 * The OAuth routes are server-to-server: the Next.js server does the dance
 * with Google or Discord, verifies the identity, and hands the profile here.
 * A shared secret proves the call came from that server and not from a
 * browser claiming to be someone.
 */
function assertInternalKey(req: Request): void {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = req.headers["x-internal-key"];
  if (!expected || provided !== expected) {
    throw new ForbiddenException("Invalid internal key");
  }
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("google")
  google(@Body() dto: OAuthProfileDto, @Req() req: Request) {
    assertInternalKey(req);
    guard(`oauth:${clientIp(req)}`, 60, 15 * MINUTE);
    return this.auth.loginWithProvider("google", dto, req.headers["user-agent"]);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("discord")
  discord(@Body() dto: OAuthProfileDto, @Req() req: Request) {
    assertInternalKey(req);
    guard(`oauth:${clientIp(req)}`, 60, 15 * MINUTE);
    return this.auth.loginWithProvider("discord", dto, req.headers["user-agent"]);
  }

  @Get("me")
  me(@Req() req: Request) {
    return this.auth.me(bearer(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    return this.auth.logout(bearer(req));
  }

  /** Cheap "who am I" for clients that already hold a resolved session. */
  @Get("session")
  session(@CurrentUser() user?: PublicUser) {
    return { user };
  }

  /** Edit the signed-in user's own profile. */
  @Patch("me")
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.auth.updateProfile(user.id, dto);
  }

  /** The mandatory first-sign-in step. */
  @Post("me/complete")
  @HttpCode(HttpStatus.OK)
  completeProfile(
    @Body() dto: CompleteProfileDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.auth.completeProfile(user.id, dto);
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
