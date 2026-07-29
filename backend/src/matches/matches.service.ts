import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, SetScoreDto, UpdateMatchDto } from "./dto/match.dto";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tournamentId?: string) {
    return this.prisma.match.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      orderBy: { createdAt: "asc" },
      include: { tournament: { select: { id: true, name: true } } },
    });
  }

  async create(dto: CreateMatchDto) {
    await this.ensureTournament(dto.tournamentId);
    return this.prisma.match.create({ data: dto });
  }

  async update(id: string, dto: UpdateMatchDto) {
    await this.ensureExists(id);
    return this.prisma.match.update({ where: { id }, data: dto });
  }

  /** Record the final score — marks the match completed. */
  async setScore(id: string, dto: SetScoreDto) {
    await this.ensureExists(id);
    return this.prisma.match.update({
      where: { id },
      data: { scoreA: dto.scoreA, scoreB: dto.scoreB, status: "completed" },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.match.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.match.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Match ${id} not found`);
  }

  private async ensureTournament(id: string) {
    const found = await this.prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Tournament ${id} not found`);
  }
}
