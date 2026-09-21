import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { User } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { generateToken, hashToken } from "./crypto.util";
import type {
  CompleteProfileDto,
  OAuthProfileDto,
  UpdateProfileDto,
} from "./dto/auth.dto";

const DAY = 24 * 60 * 60 * 1000;
/** Signing in through a provider is a deliberate act, so sessions are long. */
const SESSION_TTL = 30 * DAY;

export type Provider = "google" | "discord";

/** Shape returned to the client. */
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
  /** Which sign-in identities are bound to the account. */
  providers: Provider[];
  /** False until the mandatory first-sign-in profile step is done. */
  profileComplete: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export function toPublicUser(u: User): PublicUser {
  const providers: Provider[] = [];
  if (u.googleId) providers.push("google");
  if (u.discordId) providers.push("discord");
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
    providers,
    profileComplete: u.profileCompletedAt !== null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Timestamps written when a player finishes the profile step. */
type CompletionStamp = { profileCompletedAt: Date; agreedAt: Date };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Emails listed in ADMIN_EMAILS become admins on sign-in. This is how the
   * very first admin exists without a chicken-and-egg bootstrap.
   */
  private isAdminEmail(email: string): boolean {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase());
  }

  private async issueSession(user: User, userAgent = "") {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL);
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
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      maxAgeSeconds: SESSION_TTL / 1000,
    };
  }

  /**
   * Sign in with an identity the Next.js server has already verified with the
   * provider. The provider id is the strongest claim, so it is checked first;
   * failing that, the email links a pre-existing account (including every
   * account from the password era) on its first provider sign-in.
   */
  async loginWithProvider(
    provider: Provider,
    dto: OAuthProfileDto,
    userAgent?: string,
  ) {
    const email = dto.email.trim().toLowerCase();
    const idField = provider === "google" ? "googleId" : "discordId";

    const byId =
      provider === "google"
        ? await this.prisma.user.findUnique({
            where: { googleId: dto.providerId },
          })
        : await this.prisma.user.findUnique({
            where: { discordId: dto.providerId },
          });
    let user = byId ?? (await this.prisma.user.findUnique({ where: { email } }));

    if (user) {
      // Bind this provider to the account if it isn't yet, and pick up an avatar
      // when the account has none. Never overwrite an id that is already set:
      // that would let one provider identity hijack another's account.
      const patch: Record<string, unknown> = {};
      if (!user[idField]) patch[idField] = dto.providerId;
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
      // A provisional username; the profile step lets the player choose theirs.
      user = await this.prisma.user.create({
        data: {
          email,
          username: await this.uniqueUsername(dto.name || email.split("@")[0]),
          ...(provider === "google"
            ? { googleId: dto.providerId }
            : { discordId: dto.providerId }),
          avatarUrl: dto.avatarUrl ?? "",
          role: this.isAdminEmail(email) ? "admin" : "user",
        },
      });
    }

    const session = await this.issueSession(user, userAgent);
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

  /**
   * Update the signed-in user's own profile.
   *
   * A username change has to ripple outwards: registrations, matches and race
   * results all reference players by name, so they are rewritten in the same
   * transaction to keep a renamed player attached to their history. When the
   * profile step is being completed, its timestamps ride along in that same
   * transaction so the account can never be marked complete without its data.
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    stamp?: CompletionStamp,
  ) {
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
      ...(stamp ?? {}),
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

  /**
   * The mandatory first-sign-in step: a chosen username, a phone number, at
   * least one gamer ID, and explicit consent to the Terms and Privacy Policy.
   * Re-submitting simply re-stamps, so a player can revisit it harmlessly.
   */
  async completeProfile(userId: string, dto: CompleteProfileDto) {
    if (!dto.consoleId.trim() && !dto.pcId.trim()) {
      throw new BadRequestException("Add at least one gamer ID (console or PC)");
    }
    const now = new Date();
    return this.updateProfile(userId, dto, {
      profileCompletedAt: now,
      agreedAt: now,
    });
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
}
