import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, SetScoreDto, UpdateMatchDto } from "./dto/match.dto";

/** Fisher–Yates shuffle (in place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type NewMatch = {
  tournamentId: string;
  round: string;
  teamA: string;
  teamB: string;
  status: string;
};

/**
 * Knockout first-round label, matching the labels the public bracket renderer
 * expects (see tournament-live.tsx `knockoutRounds`): 2→Final, 4→Semifinals,
 * 8→Quarterfinals, otherwise "Round of N".
 */
function knockoutLabel(bracketSize: number): string {
  if (bracketSize <= 2) return "Final";
  if (bracketSize === 4) return "Semifinals";
  if (bracketSize === 8) return "Quarterfinals";
  return `Round of ${bracketSize}`;
}

/**
 * Pair the shuffled players into the opening knockout round. The round is named
 * for the smallest power-of-two bracket that fits them, so later rounds render
 * as the usual "TBD" slots until results come in. An odd player out gets a bye
 * (no match) rather than a placeholder opponent.
 */
function buildKnockout(players: string[], tournamentId: string): NewMatch[] {
  let bracket = 2;
  while (bracket < players.length) bracket *= 2;
  const round = knockoutLabel(bracket);
  const matches: NewMatch[] = [];
  for (let i = 0; i + 1 < players.length; i += 2) {
    matches.push({
      tournamentId,
      round,
      teamA: players[i],
      teamB: players[i + 1],
      status: "scheduled",
    });
  }
  return matches;
}

const GROUP_SIZE = 4;

/**
 * Deal the shuffled players into balanced groups of ~4, then create a full
 * round-robin (everyone plays everyone once) inside each group. Rounds are named
 * "Group A", "Group B", … which is what the standings view keys on.
 */
function buildGroups(players: string[], tournamentId: string): NewMatch[] {
  const numGroups = Math.max(1, Math.ceil(players.length / GROUP_SIZE));
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  // Deal one at a time so groups stay even when the count isn't a multiple of 4.
  players.forEach((p, i) => groups[i % numGroups].push(p));

  const matches: NewMatch[] = [];
  groups.forEach((group, gi) => {
    const round = `Group ${String.fromCharCode(65 + gi)}`;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        matches.push({
          tournamentId,
          round,
          teamA: group[i],
          teamB: group[j],
          status: "scheduled",
        });
      }
    }
  });
  return matches;
}

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

  /**
   * Shuffle the tournament's confirmed participants into a fresh draw and
   * replace its matches. group_knockout → balanced groups + round-robin;
   * knockout → first-round pairings; racing has no bracket.
   */
  async generateDraw(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, format: true },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    if (tournament.format === "racing") {
      throw new BadRequestException(
        "Racing tournaments use session results, not a bracket.",
      );
    }

    const participants = await this.prisma.participant.findMany({
      where: { tournamentId, status: "confirmed" },
      select: { team: true },
    });
    const players = shuffle(participants.map((p) => p.team));
    if (players.length < 2) {
      throw new BadRequestException(
        "Need at least 2 confirmed participants to draw a bracket.",
      );
    }

    const data =
      tournament.format === "group_knockout"
        ? buildGroups(players, tournamentId)
        : buildKnockout(players, tournamentId);

    // Replace the old draw atomically so a reshuffle never leaves a half-set.
    await this.prisma.$transaction([
      this.prisma.match.deleteMany({ where: { tournamentId } }),
      this.prisma.match.createMany({ data }),
    ]);

    return this.findAll(tournamentId);
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
