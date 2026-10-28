import { existsSync } from "node:fs";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { PublicUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";
import { presentParticipant, receiptPath } from "./receipts";
import {
  ACTIVE_STATUSES,
  isActive,
  isRegistrationClosed,
} from "./registration-rules";

type Tx = Prisma.TransactionClient;

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tournamentId?: string, team?: string, viewer?: PublicUser) {
    const rows = await this.prisma.participant.findMany({
      where: {
        ...(tournamentId ? { tournamentId } : {}),
        ...(team ? { team } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        tournament: {
          select: { id: true, name: true, game: true, status: true, tier: true },
        },
      },
    });
    return rows.map((row) => presentParticipant(row, viewer));
  }

  /**
   * Take a place in a tournament.
   *
   * A player registers only themselves, only while registration is open, only
   * once, and — for a paid tournament — together with the payment receipt, so
   * a registration never exists without its proof. A free tournament has no
   * payment to verify, so the place is confirmed straight away.
   *
   * An admin seeding a bracket by hand skips those checks. Nobody, admin
   * included, can take a place in a bracket that is already full.
   */
  async create(
    dto: CreateParticipantDto & { team: string },
    viewer: PublicUser,
    receipt?: string,
  ) {
    const isAdmin = viewer.role === "admin";
    const row = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tournament.findUnique({
        where: { id: dto.tournamentId },
        select: {
          name: true,
          status: true,
          registrationDeadline: true,
          maxTeams: true,
          entryFee: true,
        },
      });
      if (!t) throw new NotFoundException(`Tournament ${dto.tournamentId} not found`);

      let status = dto.status ?? "pending";
      if (!isAdmin) {
        if (t.status !== "open") {
          throw new BadRequestException("Registration is not open for this tournament");
        }
        if (isRegistrationClosed(t.registrationDeadline)) {
          throw new BadRequestException("Registration for this tournament has closed");
        }
        const existing = await tx.participant.count({
          where: {
            tournamentId: dto.tournamentId,
            team: dto.team,
            status: { in: [...ACTIVE_STATUSES] },
          },
        });
        if (existing > 0) {
          throw new ConflictException("You're already registered for this tournament");
        }
        // Say "full" before asking for a receipt, so nobody pays for a place
        // that isn't there.
        await this.assertPlaceFree(tx, dto.tournamentId, t.maxTeams);
        if (t.entryFee > 0 && !receipt) {
          throw new BadRequestException("Upload your payment receipt to register");
        }
        status = t.entryFee > 0 ? "pending" : "confirmed";
      }

      // A player's place was checked above; an admin adding by hand is checked here.
      if (isAdmin && isActive(status)) {
        await this.assertPlaceFree(tx, dto.tournamentId, t.maxTeams);
      }
      if (status === "confirmed") {
        await this.assertConfirmable(tx, dto.tournamentId, t.maxTeams);
      }

      return tx.participant.create({
        data: { ...dto, status, receiptUrl: receipt ?? null },
      });
    });
    return presentParticipant(row, viewer);
  }

  async update(id: string, dto: UpdateParticipantDto, viewer: PublicUser) {
    const row = await this.prisma.$transaction(async (tx) => {
      const found = await tx.participant.findUnique({
        where: { id },
        select: {
          status: true,
          tournamentId: true,
          tournament: { select: { maxTeams: true } },
        },
      });
      if (!found) throw new NotFoundException(`Participant ${id} not found`);

      // Re-admitting a rejected entry takes a place again; confirming one
      // must not push the bracket past its size.
      const next = dto.status;
      if (next && next !== found.status) {
        const max = found.tournament.maxTeams;
        if (isActive(next) && !isActive(found.status)) {
          await this.assertPlaceFree(tx, found.tournamentId, max);
        }
        if (next === "confirmed") {
          await this.assertConfirmable(tx, found.tournamentId, max, id);
        }
      }

      // Reviewing (confirm/reject) stamps the review time.
      const reviewed =
        next === "confirmed" || next === "rejected" ? { reviewedAt: new Date() } : {};
      return tx.participant.update({
        where: { id },
        data: { ...dto, ...reviewed },
      });
    });
    return presentParticipant(row, viewer);
  }

  /**
   * Attach an uploaded payment receipt. A player may only attach one to their
   * own registration, so nobody can overwrite another entrant's receipt.
   */
  async setReceipt(id: string, fileName: string, viewer: PublicUser) {
    const ownerTeam = viewer.role === "admin" ? undefined : viewer.username;
    const found = await this.prisma.participant.findUnique({
      where: { id },
      select: { id: true, team: true },
    });
    if (!found) throw new NotFoundException(`Participant ${id} not found`);
    if (ownerTeam !== undefined && found.team !== ownerTeam) {
      throw new ForbiddenException("This registration is not yours");
    }
    const row = await this.prisma.participant.update({
      where: { id },
      data: { receiptUrl: fileName },
    });
    return presentParticipant(row, viewer);
  }

  /**
   * Disk path of a registration's receipt, for an admin or the entrant only.
   * Everyone else gets the same 404 as a registration without one, so the
   * response does not confirm what exists.
   */
  async receiptFile(id: string, viewer: PublicUser): Promise<string> {
    const found = await this.prisma.participant.findUnique({
      where: { id },
      select: { team: true, receiptUrl: true },
    });
    const allowed =
      found && (viewer.role === "admin" || found.team === viewer.username);
    if (!found || !allowed || !found.receiptUrl) {
      throw new NotFoundException("Receipt not found");
    }
    const file = receiptPath(found.receiptUrl);
    if (!existsSync(file)) throw new NotFoundException("Receipt not found");
    return file;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.participant.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** A place is free while pending + confirmed registrations are below the size. */
  private async assertPlaceFree(tx: Tx, tournamentId: string, maxTeams: number) {
    const taken = await tx.participant.count({
      where: { tournamentId, status: { in: [...ACTIVE_STATUSES] } },
    });
    if (taken >= maxTeams) {
      throw new ConflictException(
        `This bracket is full (${taken} of ${maxTeams} places taken)`,
      );
    }
  }

  /** Confirmed players can never outnumber the bracket. */
  private async assertConfirmable(
    tx: Tx,
    tournamentId: string,
    maxTeams: number,
    exceptId?: string,
  ) {
    const confirmed = await tx.participant.count({
      where: {
        tournamentId,
        status: "confirmed",
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    if (confirmed >= maxTeams) {
      throw new ConflictException(
        `This bracket already has ${maxTeams} confirmed ${maxTeams === 1 ? "player" : "players"}`,
      );
    }
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.participant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Participant ${id} not found`);
  }

}
