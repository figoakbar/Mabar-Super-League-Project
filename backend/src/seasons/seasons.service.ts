import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  aggregateSeason,
  type SeasonStandings,
} from "../leaderboard/standings.util";

/** Do two [start, end) windows overlap? A null end means "runs forever". */
function overlaps(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null,
): boolean {
  const aE = aEnd ? aEnd.getTime() : Infinity;
  const bE = bEnd ? bEnd.getTime() : Infinity;
  return aStart.getTime() < bE && bStart.getTime() < aE;
}

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Seasons newest-first, each with its champion snapshot and tournament count. */
  async list() {
    await this.reconcile();
    return this.prisma.season.findMany({
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      include: {
        champions: { orderBy: { points: "desc" } },
        _count: { select: { tournaments: true } },
      },
    });
  }

  /** The id of the one active season, or null when the league is dormant. */
  async activeSeasonId(): Promise<string | null> {
    await this.reconcile();
    const s = await this.prisma.season.findFirst({
      where: { status: "active" },
      select: { id: true },
    });
    return s?.id ?? null;
  }

  /**
   * Advance season statuses to match the clock. Cheap: it only writes when a
   * boundary is actually due, so it is safe to call on every read. Runs lazily
   * in place of a background scheduler.
   */
  async reconcile() {
    const now = new Date();

    // 1. Close active seasons whose end date has passed (freezing champions).
    const expired = await this.prisma.season.findMany({
      where: { status: "active", endedAt: { lte: now } },
      select: { id: true },
    });
    for (const s of expired) {
      await this.snapshotChampions(s.id);
      await this.prisma.season.update({
        where: { id: s.id },
        data: { status: "closed" },
      });
    }

    // 2. Activate upcoming seasons whose start date has arrived (and close them
    //    straight away if their window is already entirely in the past).
    const due = await this.prisma.season.findMany({
      where: { status: "upcoming", startedAt: { lte: now } },
      select: { id: true, endedAt: true },
    });
    for (const s of due) {
      if (s.endedAt && s.endedAt <= now) {
        await this.snapshotChampions(s.id);
        await this.prisma.season.update({
          where: { id: s.id },
          data: { status: "closed" },
        });
      } else {
        await this.prisma.season.update({
          where: { id: s.id },
          data: { status: "active" },
        });
      }
    }
  }

  /**
   * Create a season for a chosen window. Starting today makes it active now;
   * a future start makes it `upcoming` until its date arrives. A prior
   * open-ended season is auto-chained (its end set to this start) for a seamless
   * rollover; overlapping a bounded season is rejected.
   */
  async schedule(name?: string, startAt?: Date, endAt?: Date | null) {
    const start = startAt ?? new Date();
    const end = endAt ?? null;
    if (end && end.getTime() <= start.getTime()) {
      throw new BadRequestException("End date must be after the start date.");
    }

    const others = await this.prisma.season.findMany();
    // At most one open-ended season can exist (the invariant below guarantees
    // it); if it starts before this one, chain its end onto this start.
    const openEndedPrior = others.find(
      (s) =>
        s.endedAt == null &&
        s.status !== "closed" &&
        s.startedAt.getTime() < start.getTime(),
    );
    this.assertNoOverlap(others, start, end, openEndedPrior?.id, start);

    const clean = name?.trim() || (await this.nextDefaultName());
    const now = new Date();
    const status = now.getTime() >= start.getTime() ? "active" : "upcoming";

    const created = await this.prisma.$transaction(async (tx) => {
      if (openEndedPrior) {
        await tx.season.update({
          where: { id: openEndedPrior.id },
          data: { endedAt: start },
        });
      }
      return tx.season.create({
        data: { name: clean, status, startedAt: start, endedAt: end },
      });
    });

    await this.reconcile();
    return this.findOne(created.id);
  }

  /** Edit a season's window (and/or name). Re-validates non-overlap. */
  async updateDates(
    id: string,
    dto: { name?: string; startAt?: Date; endAt?: Date | null },
  ) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException(`Season ${id} not found`);

    const start = dto.startAt ?? season.startedAt;
    const end = dto.endAt !== undefined ? dto.endAt : season.endedAt;
    if (end && end.getTime() <= start.getTime()) {
      throw new BadRequestException("End date must be after the start date.");
    }

    const others = await this.prisma.season.findMany();
    this.assertNoOverlap(others, start, end, id);

    const data: {
      startedAt: Date;
      endedAt: Date | null;
      name?: string;
      status?: string;
    } = { startedAt: start, endedAt: end };
    if (dto.name?.trim()) data.name = dto.name.trim();
    // Keep a non-closed season's status coherent with its new window; closed
    // seasons stay closed (edits are a record fix, they never resurrect one).
    if (season.status !== "closed") {
      data.status = new Date().getTime() >= start.getTime() ? "active" : "upcoming";
    }

    await this.prisma.season.update({ where: { id }, data });
    await this.reconcile();
    return this.findOne(id);
  }

  /** Start a season now (thin wrapper over schedule with today's date). */
  start(name?: string) {
    return this.schedule(name, new Date());
  }

  /** Close a season now without opening another (league goes dormant). */
  async close(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    if (season.status === "closed") return this.findOne(id);
    await this.snapshotChampions(id);
    await this.prisma.season.update({
      where: { id },
      data: { status: "closed", endedAt: new Date() },
    });
    return this.findOne(id);
  }

  async rename(id: string, name: string) {
    await this.ensureExists(id);
    await this.prisma.season.update({
      where: { id },
      data: { name: name.trim() },
    });
    return this.findOne(id);
  }

  /** Refresh a season's Hall-of-Fame snapshot (e.g. after a late result). */
  async recomputeChampions(id: string) {
    await this.ensureExists(id);
    await this.snapshotChampions(id);
    return this.findOne(id);
  }

  /**
   * Rank one season's completed tournaments — overall and per game. Owns the
   * standings maths so both the public leaderboard and the champion snapshot
   * share it (and so the leaderboard can depend on this service, not vice
   * versa, keeping module deps one-directional).
   */
  async computeSeasonStandings(seasonId: string): Promise<SeasonStandings> {
    const [users, tournaments] = await Promise.all([
      this.prisma.user.findMany({
        select: { username: true, avatarUrl: true },
      }),
      this.prisma.tournament.findMany({
        where: { status: "completed", seasonId },
        select: {
          game: true,
          tier: true,
          participants: {
            where: { status: "confirmed" },
            select: { team: true },
          },
          matches: {
            where: {
              status: "completed",
              scoreA: { not: null },
              scoreB: { not: null },
            },
            select: {
              teamA: true,
              teamB: true,
              scoreA: true,
              scoreB: true,
              round: true,
            },
          },
        },
      }),
    ]);

    const userSet = new Set(users.map((u) => u.username));
    const avatarByName = new Map(users.map((u) => [u.username, u.avatarUrl]));
    return aggregateSeason(tournaments, userSet, avatarByName);
  }

  /**
   * Freeze who topped a season: the overall leader (game = "") plus each game's
   * leader.
   */
  private async snapshotChampions(seasonId: string) {
    const { overall, byGame } = await this.computeSeasonStandings(seasonId);

    const rows: {
      seasonId: string;
      game: string;
      username: string;
      points: number;
    }[] = [];
    if (overall[0])
      rows.push({
        seasonId,
        game: "",
        username: overall[0].username,
        points: overall[0].points,
      });
    for (const [game, list] of byGame) {
      if (list[0])
        rows.push({
          seasonId,
          game,
          username: list[0].username,
          points: list[0].points,
        });
    }

    await this.prisma.$transaction([
      this.prisma.seasonChampion.deleteMany({ where: { seasonId } }),
      ...(rows.length
        ? [this.prisma.seasonChampion.createMany({ data: rows })]
        : []),
    ]);
  }

  /** Reject a window that overlaps another season's. `chainedId` is treated as
   *  ending at `chainedEnd` (its auto-chained end), and `selfId` is skipped. */
  private assertNoOverlap(
    others: { id: string; name: string; startedAt: Date; endedAt: Date | null }[],
    start: Date,
    end: Date | null,
    selfId?: string,
    chainedEnd?: Date,
  ) {
    for (const s of others) {
      if (selfId && s.id === selfId) continue;
      const sEnd =
        chainedEnd && s.endedAt == null && s.startedAt.getTime() < start.getTime()
          ? chainedEnd
          : s.endedAt;
      if (overlaps(start, end, s.startedAt, sEnd)) {
        throw new BadRequestException(
          `Those dates overlap "${s.name}". Seasons can't run at the same time.`,
        );
      }
    }
  }

  private findOne(id: string) {
    return this.prisma.season.findUnique({
      where: { id },
      include: {
        champions: { orderBy: { points: "desc" } },
        _count: { select: { tournaments: true } },
      },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.season.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Season ${id} not found`);
  }

  private async nextDefaultName() {
    const count = await this.prisma.season.count();
    return `Season ${count + 1}`;
  }
}
