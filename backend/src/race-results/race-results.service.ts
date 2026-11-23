import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  CreateRaceResultDto,
  FillRaceResultsDto,
  UpdateRaceResultDto,
} from "./dto/race-result.dto";
import { LAP_TIME_HINT, normalizeLapTime } from "./lap-time";

const SESSION_LABEL: Record<string, string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  race: "Race",
};

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
      orderBy: [
        { session: "asc" },
        { position: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
    });
  }

  async create(dto: CreateRaceResultDto) {
    await this.ensureRacing(dto.tournamentId);
    const driver = dto.driver.trim();
    await this.assertDriver(dto.tournamentId, driver);
    await this.assertFree(dto.tournamentId, dto.session, driver, dto.position);
    const lapTime = lapTimeOf(dto.lapTime);
    return this.prisma.raceResult.create({
      data: { ...dto, driver, ...(lapTime !== undefined ? { lapTime } : {}) },
    });
  }

  /**
   * Put every confirmed participant missing from `session` into it, without a
   * position yet, so the admin only fills in positions and lap times. Running
   * it again adds only drivers confirmed since.
   */
  async fill(dto: FillRaceResultsDto) {
    await this.ensureRacing(dto.tournamentId);
    const [confirmed, present] = await Promise.all([
      this.prisma.participant.findMany({
        where: { tournamentId: dto.tournamentId, status: "confirmed" },
        orderBy: { createdAt: "asc" },
        select: { team: true },
      }),
      this.prisma.raceResult.findMany({
        where: { tournamentId: dto.tournamentId, session: dto.session },
        select: { driver: true },
      }),
    ]);
    const have = new Set(present.map((r) => r.driver));
    const missing = confirmed.map((p) => p.team).filter((t) => !have.has(t));
    if (missing.length > 0) {
      await this.prisma.raceResult.createMany({
        data: missing.map((driver) => ({
          tournamentId: dto.tournamentId,
          session: dto.session,
          driver,
        })),
      });
    }
    return { added: missing.length };
  }

  async update(id: string, dto: UpdateRaceResultDto) {
    const found = await this.prisma.raceResult.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`Race result ${id} not found`);
    const driver = dto.driver !== undefined ? dto.driver.trim() : found.driver;
    const session = dto.session ?? found.session;
    // `null` clears a position (a driver who didn't finish).
    const position = dto.position !== undefined ? dto.position : found.position;
    if (driver !== found.driver) await this.assertDriver(found.tournamentId, driver);
    await this.assertFree(found.tournamentId, session, driver, position, id);
    const lapTime = lapTimeOf(dto.lapTime);
    return this.prisma.raceResult.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.driver !== undefined ? { driver } : {}),
        ...(lapTime !== undefined ? { lapTime } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.raceResult.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Only a confirmed participant can be classified, so points reach a real entrant. */
  private async assertDriver(tournamentId: string, driver: string) {
    const found = await this.prisma.participant.findFirst({
      where: { tournamentId, status: "confirmed", team: driver },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException(
        `"${driver}" isn't a confirmed participant of this tournament.`,
      );
    }
  }

  /** A driver appears once per session, and a position belongs to one driver. */
  private async assertFree(
    tournamentId: string,
    session: string,
    driver: string,
    position: number | null | undefined,
    exceptId?: string,
  ) {
    const others = await this.prisma.raceResult.findMany({
      where: {
        tournamentId,
        session,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { driver: true, position: true },
    });
    const label = SESSION_LABEL[session] ?? session;
    if (others.some((r) => r.driver === driver)) {
      throw new BadRequestException(`${driver} is already in ${label}.`);
    }
    const holder = position != null && others.find((r) => r.position === position);
    if (holder) {
      throw new BadRequestException(
        `P${position} in ${label} already belongs to ${holder.driver}.`,
      );
    }
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.raceResult.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Race result ${id} not found`);
  }

  private async ensureRacing(id: string) {
    const found = await this.prisma.tournament.findUnique({
      where: { id },
      select: { format: true },
    });
    if (!found) throw new NotFoundException(`Tournament ${id} not found`);
    if (found.format !== "racing") {
      throw new BadRequestException(
        "Race results are only for racing tournaments.",
      );
    }
  }
}

/** The stored form of a submitted lap time; undefined when none was sent. */
function lapTimeOf(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;
  const tidy = normalizeLapTime(input);
  if (tidy === null) throw new BadRequestException(LAP_TIME_HINT);
  return tidy;
}
