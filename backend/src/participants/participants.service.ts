import { existsSync } from "node:fs";

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { PublicUser } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";
import { presentParticipant, receiptPath } from "./receipts";

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

  /** `team` is required here: the controller fills it in from the session. */
  async create(dto: CreateParticipantDto & { team: string }, viewer: PublicUser) {
    await this.ensureTournament(dto.tournamentId);
    const row = await this.prisma.participant.create({ data: dto });
    return presentParticipant(row, viewer);
  }

  async update(id: string, dto: UpdateParticipantDto, viewer: PublicUser) {
    await this.ensureExists(id);
    // Reviewing (confirm/reject) stamps the review time.
    const reviewed =
      dto.status === "confirmed" || dto.status === "rejected"
        ? { reviewedAt: new Date() }
        : {};
    const row = await this.prisma.participant.update({
      where: { id },
      data: { ...dto, ...reviewed },
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

  private async ensureExists(id: string) {
    const found = await this.prisma.participant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Participant ${id} not found`);
  }

  private async ensureTournament(id: string) {
    const found = await this.prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Tournament ${id} not found`);
  }
}
