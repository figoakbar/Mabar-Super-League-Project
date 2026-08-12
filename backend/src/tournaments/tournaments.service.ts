import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Match,
  Participant,
  ScheduleItem,
  Tournament,
} from "@prisma/client";

import { tournamentPoints } from "../leaderboard/points.util";
import { PrismaService } from "../prisma/prisma.service";
import { SeasonsService } from "../seasons/seasons.service";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { ScheduleItemDto } from "./dto/schedule-item.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";

type Counts = { participants: number; matches: number };
type SeasonRef = { id: string; name: string } | null;
type WithCount = Tournament & {
  _count?: Counts;
  schedule?: ScheduleItem[];
  season?: SeasonRef;
};
type WithRelations = Tournament & {
  participants?: Participant[];
  matches?: Match[];
  schedule?: ScheduleItem[];
  _count?: Counts;
  season?: SeasonRef;
};

/** Schedule rows keep the order the admin arranged them in. */
function scheduleCreateData(items: ScheduleItemDto[]) {
  return items
    .filter((s) => s.label.trim().length > 0)
    .map((s, i) => ({
      label: s.label.trim(),
      date: s.date ?? "",
      time: s.time ?? "",
      position: s.position ?? i,
    }));
}

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasons: SeasonsService,
  ) {}

  private serialize(t: WithRelations) {
    const { _count, ...rest } = t;
    const registeredTeams = _count?.participants ?? t.participants?.length ?? 0;
    // matchCount lets the frontend tell a "drawn" tournament from an undrawn one.
    const matchCount = _count?.matches ?? t.matches?.length ?? 0;
    // What each placement is worth here, from the tier + bracket size — so the
    // tournament page can show the season points on offer (0 for exhibitions).
    const field = rest.maxTeams;
    const seasonPoints = {
      champion: tournamentPoints({ wonFinal: true, lostRound: null, playedAny: true }, rest.tier, field),
      runnerUp: tournamentPoints({ wonFinal: false, lostRound: "Final", playedAny: true }, rest.tier, field),
      semifinal: tournamentPoints({ wonFinal: false, lostRound: "Semifinals", playedAny: true }, rest.tier, field),
    };
    return { ...rest, registeredTeams, matchCount, seasonPoints };
  }

  async findAll() {
    const rows = await this.prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        schedule: { orderBy: { position: "asc" } },
        season: { select: { id: true, name: true } },
        _count: { select: { participants: true, matches: true } },
      },
    });
    return rows.map((r: WithCount) => this.serialize(r));
  }

  async findOne(id: string) {
    const row = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: { orderBy: { createdAt: "asc" } },
        matches: { orderBy: { createdAt: "asc" } },
        schedule: { orderBy: { position: "asc" } },
        season: { select: { id: true, name: true } },
        _count: { select: { participants: true, matches: true } },
      },
    });
    if (!row) throw new NotFoundException(`Tournament ${id} not found`);
    return this.serialize(row);
  }

  async create(dto: CreateTournamentDto) {
    const { schedule, ...rest } = dto;
    // A new tournament joins the active season unless one was picked explicitly.
    const seasonId =
      rest.seasonId ?? (await this.seasons.activeSeasonId()) ?? undefined;
    const row = await this.prisma.tournament.create({
      data: {
        ...rest,
        seasonId,
        ...(schedule?.length
          ? { schedule: { create: scheduleCreateData(schedule) } }
          : {}),
      },
      include: {
        schedule: { orderBy: { position: "asc" } },
        season: { select: { id: true, name: true } },
        _count: { select: { participants: true, matches: true } },
      },
    });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdateTournamentDto) {
    await this.ensureExists(id);
    const { schedule, ...rest } = dto;
    const row = await this.prisma.tournament.update({
      where: { id },
      data: {
        ...rest,
        // A supplied schedule replaces the existing one wholesale.
        ...(schedule
          ? {
              schedule: {
                deleteMany: {},
                create: scheduleCreateData(schedule),
              },
            }
          : {}),
      },
      include: {
        schedule: { orderBy: { position: "asc" } },
        season: { select: { id: true, name: true } },
        _count: { select: { participants: true, matches: true } },
      },
    });
    return this.serialize(row);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.tournament.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Tournament ${id} not found`);
  }
}
