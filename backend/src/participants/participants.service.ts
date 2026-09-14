import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tournamentId?: string, team?: string) {
    return this.prisma.participant.findMany({
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
  }

  /** `team` is required here: the controller fills it in from the session. */
  async create(dto: CreateParticipantDto & { team: string }) {
    await this.ensureTournament(dto.tournamentId);
    return this.prisma.participant.create({ data: dto });
  }

  async update(id: string, dto: UpdateParticipantDto) {
    await this.ensureExists(id);
    // Reviewing (confirm/reject) stamps the review time.
    const reviewed =
      dto.status === "confirmed" || dto.status === "rejected"
        ? { reviewedAt: new Date() }
        : {};
    return this.prisma.participant.update({
      where: { id },
      data: { ...dto, ...reviewed },
    });
  }

  /**
   * Attach an uploaded payment receipt. When `ownerTeam` is given the row must
   * belong to that entrant, so one user cannot overwrite another's receipt.
   */
  async setReceipt(id: string, receiptUrl: string, ownerTeam?: string) {
    const found = await this.prisma.participant.findUnique({
      where: { id },
      select: { id: true, team: true },
    });
    if (!found) throw new NotFoundException(`Participant ${id} not found`);
    if (ownerTeam !== undefined && found.team !== ownerTeam) {
      throw new ForbiddenException("This registration is not yours");
    }
    return this.prisma.participant.update({
      where: { id },
      data: { receiptUrl },
    });
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
