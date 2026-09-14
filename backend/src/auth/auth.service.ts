import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { User } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./crypto.util";
import { passwordProblems } from "./password.policy";
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { MailService } from "./mail.service";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = 12 * 60 * 60 * 1000; // 12 hours
const REMEMBER_TTL = 30 * DAY;
const RESET_TTL = 60 * 60 * 1000; // 1 hour

/** Shape returned to the client — never includes the password hash. */
export type PublicUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  phone: string;
  consoleId: string;
  pcId: string;
  instagram: string;
  avatarUrl: string;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    phone: u.phone,
    consoleId: u.consoleId,
    pcId: u.pcId,
    instagram: u.instagram,
    avatarUrl: u.avatarUrl,
    hasPassword: u.passwordHash !== null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Emails listed in ADMIN_EMAILS become admins on sign-up / sign-in. This is
   * how the very first admin exists without a chicken-and-egg bootstrap.
   */
  /** Refuse a new password that breaks the shared policy, naming the first problem. */
  private assertPasswordOk(
    password: string,
    who: { username?: string; email?: string },
  ): void {
    const problems = passwordProblems(password, who);
    if (problems.length) throw new BadRequestException(problems[0]);
  }

  private isAdminEmail(email: string): boolean {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase());
  }

  private async issueSession(user: User, remember: boolean, userAgent = "") {
    const token = generateToken();
    const ttl = remember ? REMEMBER_TTL : SESSION_TTL;
    const expiresAt = new Date(Date.now() + ttl);
    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt,
        userAgent: userAgent.slice(0, 200),
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return { token, expiresAt: expiresAt.toISOString(), maxAgeSeconds: ttl / 1000 };
  }

  async register(dto: RegisterDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const clash = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (clash) {
      throw new ConflictException(
        clash.email === email
          ? "An account with that email already exists"
          : "That username is taken",
      );
    }

    this.assertPasswordOk(dto.password, { username, email });

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash: await hashPassword(dto.password),
        role: this.isAdminEmail(email) ? "admin" : "user",
        phone: dto.phone ?? "",
        consoleId: dto.consoleId ?? "",
        pcId: dto.pcId ?? "",
        instagram: dto.instagram ?? "",
      },
    });

    const session = await this.issueSession(user, !!dto.remember, userAgent);
    return { user: toPublicUser(user), ...session };
  }

  async login(dto: LoginDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Verify even when the user is missing so the response time does not
    // reveal whether an email is registered.
    const ok = await verifyPassword(dto.password, user?.passwordHash ?? null);
    if (!user || !ok) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    // Keep admin rights in sync with ADMIN_EMAILS on every login.
    const shouldBeAdmin = this.isAdminEmail(email);
    const fresh =
      shouldBeAdmin && user.role !== "admin"
        ? await this.prisma.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          })
        : user;

    const session = await this.issueSession(fresh, !!dto.remember, userAgent);
    return { user: toPublicUser(fresh), ...session };
  }

  /** Called by the Next.js server once it has verified a Google ID token. */
  async loginWithGoogle(dto: GoogleLoginDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: dto.googleId }, { email }] },
    });

    if (user) {
      // Link the Google account to the existing email-based account.
      const patch: Record<string, unknown> = {};
      if (!user.googleId) patch.googleId = dto.googleId;
      if (!user.avatarUrl && dto.avatarUrl) patch.avatarUrl = dto.avatarUrl;
      if (this.isAdminEmail(email) && user.role !== "admin") {
        patch.role = "admin";
      }
      if (Object.keys(patch).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: patch,
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          username: await this.uniqueUsername(dto.name || email.split("@")[0]),
          googleId: dto.googleId,
          avatarUrl: dto.avatarUrl ?? "",
          role: this.isAdminEmail(email) ? "admin" : "user",
        },
      });
    }

    // Google sign-in is an explicit, deliberate action — treat it as "remember".
    const session = await this.issueSession(user, true, userAgent);
    return { user: toPublicUser(user), ...session };
  }

  private async uniqueUsername(seed: string) {
    const base =
      seed
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .slice(0, 24) || "player";
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}${i}`;
      const taken = await this.prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    return `${base}${generateToken(4)}`;
  }

  /** Resolve a bearer token to its user, sliding expired sessions out of the way. */
  async resolveSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => undefined);
      return null;
    }
    return session;
  }

  async me(token: string) {
    const session = await this.resolveSession(token);
    if (!session) throw new UnauthorizedException("Session expired");
    return {
      user: toPublicUser(session.user),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async logout(token: string) {
    await this.prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
    return { ok: true };
  }

  /** Revoke every session for a user — used after a password reset. */
  private async revokeAllSessions(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async forgotPassword(dto: ForgotPasswordDto, resetUrlBase: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    let devLink: string | undefined;

    // Always report success: revealing which emails exist enables enumeration.
    if (user) {
      // One live token at a time.
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      const token = generateToken();
      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TTL),
        },
      });
      const link = `${resetUrlBase.replace(/\/$/, "")}/reset-password?token=${token}`;
      await this.mail
        .sendPasswordReset(user.email, link, RESET_TTL / 60000)
        .catch((e: unknown) =>
          this.logger.error(
            `Failed to send reset email: ${e instanceof Error ? e.message : e}`,
          ),
        );
      // Development convenience: with no SMTP configured there is no inbox to
      // check, so hand the link back for the UI to show. Never in production.
      if (!this.mail.enabled && process.env.NODE_ENV !== "production") {
        devLink = link;
      }
    }

    return {
      ok: true,
      message:
        "If an account exists for that email, a reset link is on its way.",
      ...(devLink ? { devLink } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        "This reset link is invalid or has expired. Request a new one.",
      );
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: row.userId },
      select: { username: true, email: true },
    });
    this.assertPasswordOk(dto.password, owner ?? {});

    await this.prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(dto.password) },
    });
    await this.prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    // Anyone holding an old session (including an attacker) is logged out.
    await this.revokeAllSessions(row.userId);

    return { ok: true };
  }

  /**
   * Update the signed-in user's own profile.
   *
   * A username change has to ripple outwards: registrations, matches and race
   * results all reference players by name, so they are rewritten in the same
   * transaction to keep a renamed player attached to their history.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new NotFoundException("Account not found");

    const nextUsername = dto.username?.trim();
    const renaming = !!nextUsername && nextUsername !== current.username;

    if (renaming) {
      const taken = await this.prisma.user.findUnique({
        where: { username: nextUsername },
        select: { id: true },
      });
      if (taken) throw new ConflictException("That username is taken");
    }

    const data = {
      ...(renaming ? { username: nextUsername } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
      ...(dto.consoleId !== undefined ? { consoleId: dto.consoleId.trim() } : {}),
      ...(dto.pcId !== undefined ? { pcId: dto.pcId.trim() } : {}),
      ...(dto.instagram !== undefined
        ? { instagram: dto.instagram.trim() }
        : {}),
    };

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data }),
      ...(renaming
        ? [
            this.prisma.participant.updateMany({
              where: { team: current.username },
              data: { team: nextUsername },
            }),
            this.prisma.participant.updateMany({
              where: { captain: current.username },
              data: { captain: nextUsername },
            }),
            this.prisma.match.updateMany({
              where: { teamA: current.username },
              data: { teamA: nextUsername },
            }),
            this.prisma.match.updateMany({
              where: { teamB: current.username },
              data: { teamB: nextUsername },
            }),
            this.prisma.raceResult.updateMany({
              where: { driver: current.username },
              data: { driver: nextUsername },
            }),
          ]
        : []),
    ]);

    return toPublicUser(user);
  }

  /** Point the account at a newly uploaded avatar. */
  async setAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return toPublicUser(user);
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: "" },
    });
    return toPublicUser(user);
  }

  /**
   * Change the password of the signed-in user. Accounts created through Google
   * have no password yet, so those may set one without proving an old one.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Account not found");

    if (user.passwordHash) {
      const ok = await verifyPassword(
        dto.currentPassword ?? "",
        user.passwordHash,
      );
      if (!ok) {
        throw new BadRequestException("Your current password is incorrect");
      }
    }

    this.assertPasswordOk(dto.newPassword, {
      username: user.username,
      email: user.email,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(dto.newPassword) },
    });
    return { ok: true };
  }

  /** Housekeeping: drop expired sessions and reset tokens. */
  async purgeExpired() {
    const now = new Date();
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
    await this.prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
  }
}
