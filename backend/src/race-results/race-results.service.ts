import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  CreateRaceResultDto,
  UpdateRaceResultDto,
} from "./dto/race-result.dto";

@Injectable()
export class RaceResultsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tournamentId?: string, session?: string) {
    return this.prisma.raceResult.findMany({
      where: {
        ...(tournamentId ? { tournamentId } : {}),
        ...(session ? { session } : {}),
      },
      // Unplaced drivers (no position yet) go last.
      orderBy: [{ session: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    });
  }

  async create(dto: CreateRaceResultDto) {
    await this.ensureTournament(dto.tournamentId);
    return this.prisma.raceResult.create({ data: dto });
  }

  async update(id: string, dto: UpdateRaceResultDto) {
    await this.ensureExists(id);
    return this.prisma.raceResult.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.raceResult.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.raceResult.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Race result ${id} not found`);
  }

  private async ensureTournament(id: string) {
    const found = await this.prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Tournament ${id} not found`);
  }
}
