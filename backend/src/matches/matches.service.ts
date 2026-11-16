import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, SetScoreDto, UpdateMatchDto } from "./dto/match.dto";
import { groupCount, rankGroup, topTwo } from "./group-standings";
import { assertDecisive, normalizeRound } from "./rounds";

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
  /** Slot in the round, so the next round pairs neighbours (0 with 1, …). */
  position: number;
};

/** A bye: the player in teamA goes straight through, with no opponent. */
const BYE = "bye";

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
 * Lay the shuffled players into the opening round of the smallest power-of-two
 * bracket that fits them. The empty places become byes, so exactly a power of
 * two reaches the second round: 5 players in a bracket of 8 → 3 byes and one
 * match. Byes take every other slot first, so they meet match winners rather
 * than each other where they can. The later rounds are added empty by
 * `buildBracket`.
 */
function buildKnockout(players: string[], tournamentId: string): NewMatch[] {
  let bracket = 2;
  while (bracket < players.length) bracket *= 2;
  const round = knockoutLabel(bracket);
  const slots = bracket / 2;
  const byes = bracket - players.length;
  const order = [
    ...Array.from({ length: Math.ceil(slots / 2) }, (_, i) => i * 2),
    ...Array.from({ length: Math.floor(slots / 2) }, (_, i) => i * 2 + 1),
  ];
  const byeSlots = new Set(order.slice(0, byes));

  const queue = [...players];
  const matches: NewMatch[] = [];
  for (let position = 0; position < slots; position++) {
    const bye = byeSlots.has(position);
    matches.push({
      tournamentId,
      round,
      teamA: queue.shift()!,
      teamB: bye ? "" : queue.shift()!,
      status: bye ? BYE : "scheduled",
      position,
    });
  }
  return matches;
}

/**
 * Deal the shuffled players into groups (see `groupCount`), then create a full
 * round-robin (everyone plays everyone once) inside each group. Rounds are named
 * "Group A", "Group B", … which is what the standings view keys on.
 */
function buildGroups(players: string[], tournamentId: string): NewMatch[] {
  const numGroups = groupCount(players.length);
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  // Deal one at a time so no group is more than one player bigger than another.
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
          position: matches.length,
        });
      }
    }
  });
  return matches;
}

/** Players in a knockout round: "Final" → 2, "Semifinals" → 4, "Round of 16" → 16. */
function roundSize(round: string): number {
  if (round === "Final") return 2;
  if (round === "Semifinals") return 4;
  if (round === "Quarterfinals") return 8;
  const n = /^Round of (\d+)$/.exec(round);
  return n ? Number(n[1]) : 0;
}

const isPowerOfTwo = (n: number) => n >= 1 && (n & (n - 1)) === 0;

type Row = {
  id: string;
  round: string;
  position: number;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
};

/** Who goes through from a decided slot, or null while it's still open. */
function winnerOf(m: Row): string | null {
  if (m.status === BYE) return m.teamA || null;
  if (m.status !== "completed" || m.scoreA == null || m.scoreB == null) return null;
  if (m.scoreA === m.scoreB) return null;
  return m.scoreA > m.scoreB ? m.teamA : m.teamB;
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tournamentId?: string) {
    return this.prisma.match.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      // A draw is written in one go, so its rows share a timestamp.
      orderBy: [{ createdAt: "asc" }, { position: "asc" }],
      include: { tournament: { select: { id: true, name: true, tier: true } } },
    });
  }

  async create(dto: CreateMatchDto) {
    await this.ensureTournament(dto.tournamentId);
    const round = normalizeRound(dto.round);
    await this.assertPlayers(dto.tournamentId, dto.teamA, dto.teamB, false);
    // A knockout round holds a fixed number of matches; past that, a new one
    // would duplicate a bracket slot.
    const size = roundSize(round);
    if (size > 0) {
      const taken = await this.prisma.match.count({
        where: { tournamentId: dto.tournamentId, round },
      });
      if (taken >= size / 2) {
        throw new BadRequestException(
          `${round} already has all ${size / 2} of its ${size === 2 ? "match" : "matches"}. Set the players on one of them instead.`,
        );
      }
      return this.prisma.match.create({ data: { ...dto, round, position: taken } });
    }
    return this.prisma.match.create({ data: { ...dto, round } });
  }

  async update(id: string, dto: UpdateMatchDto) {
    const found = await this.prisma.match.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`Match ${id} not found`);
    const round = dto.round !== undefined ? normalizeRound(dto.round) : found.round;
    // Re-check the result whenever it (or the round it belongs to) changes.
    const scoreA = dto.scoreA ?? found.scoreA;
    const scoreB = dto.scoreB ?? found.scoreB;
    const status = dto.status ?? found.status;
    if (dto.teamA !== undefined || dto.teamB !== undefined) {
      // A bracket slot may be left open ("") until its player is known.
      await this.assertPlayers(
        found.tournamentId,
        dto.teamA ?? found.teamA,
        dto.teamB ?? found.teamB,
        true,
      );
    }
    if (status === "completed" && scoreA != null && scoreB != null) {
      assertDecisive(round, scoreA, scoreB);
    }
    const row = await this.prisma.match.update({
      where: { id },
      data: { ...dto, ...(dto.round !== undefined ? { round } : {}) },
    });
    await this.advance(row);
    return row;
  }

  /**
   * Record the final score — marks the match completed and moves the winner
   * into their next bracket slot (or, after the last group match, fills the
   * knockout from the group tables).
   */
  async setScore(id: string, dto: SetScoreDto) {
    const found = await this.prisma.match.findUnique({
      where: { id },
      select: { round: true, status: true, teamA: true, teamB: true },
    });
    if (!found) throw new NotFoundException(`Match ${id} not found`);
    if (found.status === BYE) {
      throw new BadRequestException("A bye has no score — the player goes straight through.");
    }
    if (!found.teamA || !found.teamB) {
      throw new BadRequestException(
        "Both players must be known before this match can have a score.",
      );
    }
    assertDecisive(found.round, dto.scoreA, dto.scoreB);
    const row = await this.prisma.match.update({
      where: { id },
      data: { scoreA: dto.scoreA, scoreB: dto.scoreB, status: "completed" },
    });
    await this.advance(row);
    return row;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.match.delete({ where: { id } });
    return { id, deleted: true };
  }

  /**
   * Shuffle the tournament's confirmed participants into a fresh draw and
   * replace its matches. knockout → the whole bracket down to the Final, byes
   * already through; group_knockout → round-robin groups plus the empty
   * knockout bracket they feed; racing has no bracket.
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
    await this.buildBracket(tournamentId, true);

    return this.findAll(tournamentId);
  }

  /**
   * Make sure every knockout round down to the Final exists, with open slots
   * where the player isn't known yet, then move every decided result forward.
   * A new draw does this itself; this also brings a draw made before full
   * brackets existed up to date. Safe to run again.
   */
  async buildBracket(tournamentId: string, quiet = false) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { format: true },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    const refuse = (message: string) => {
      if (quiet) return null;
      throw new BadRequestException(message);
    };
    if (tournament.format === "racing") {
      return refuse("Racing tournaments use session results, not a bracket.");
    }

    const rows = await this.rows(tournamentId);
    const knockout = rows.filter((m) => roundSize(m.round) > 0);
    const groups = [...new Set(rows.map((m) => m.round))].filter((r) =>
      r.startsWith("Group "),
    );

    let first: number;
    if (tournament.format === "group_knockout" && knockout.length === 0) {
      if (groups.length === 0) return refuse("Draw this tournament first in Admin → Drawing.");
      if (!isPowerOfTwo(groups.length)) {
        return refuse(
          `With ${groups.length} groups the knockout can't be paired automatically. Add its matches by hand.`,
        );
      }
      first = groups.length * 2;
    } else if (knockout.length === 0) {
      return refuse("Draw this tournament first in Admin → Drawing.");
    } else {
      first = Math.max(...knockout.map((m) => roundSize(m.round)));
    }

    for (let size = first; size >= 2; size /= 2) {
      const round = knockoutLabel(size);
      const slots = size / 2;
      const inRound = rows.filter((m) => m.round === round);
      if (inRound.length > slots) {
        return refuse(`${round} has more matches than it has places. Delete the extra ones first.`);
      }
      const opening = size === first && tournament.format === "knockout";
      if (opening && inRound.length < slots) {
        return refuse(
          "This draw was made before byes were recorded, so the bracket can't be completed. Re-shuffle it in Drawing.",
        );
      }
      // Older rows all sit at position 0; give them their slots in order.
      const positions = new Set(inRound.map((m) => m.position));
      if (positions.size !== inRound.length) {
        for (const [i, m] of inRound.entries()) {
          await this.prisma.match.update({ where: { id: m.id }, data: { position: i } });
          m.position = i;
        }
      }
      const used = new Set(inRound.map((m) => m.position));
      const missing = Array.from({ length: slots }, (_, i) => i).filter((i) => !used.has(i));
      if (missing.length > 0) {
        await this.prisma.match.createMany({
          data: missing.map((position) => ({
            tournamentId,
            round,
            teamA: "",
            teamB: "",
            status: "scheduled",
            position,
          })),
        });
      }
    }

    // Move every decided result forward, earliest round first.
    for (let size = first; size > 2; size /= 2) {
      const round = knockoutLabel(size);
      for (const m of await this.rows(tournamentId, round)) {
        const winner = winnerOf(m);
        if (winner) await this.place(tournamentId, size, m.position, winner);
      }
    }
    if (tournament.format === "group_knockout") await this.fillFromGroups(tournamentId);
    return this.findAll(tournamentId);
  }

  /** After a result changes, carry its consequence into the bracket. */
  private async advance(row: Row & { tournamentId: string }) {
    if (row.round.startsWith("Group ")) {
      await this.fillFromGroups(row.tournamentId);
      return;
    }
    const size = roundSize(row.round);
    const winner = winnerOf(row);
    if (size > 2 && winner) await this.place(row.tournamentId, size, row.position, winner);
  }

  /**
   * Put `player` into the next-round slot fed by (round of `size`, `position`):
   * slots 0 and 1 feed slot 0, 2 and 3 feed slot 1, and so on. If a different
   * player had already played on from there, that later result no longer
   * stands, so it is cleared and the change follows down the bracket.
   */
  private async place(tournamentId: string, size: number, position: number, player: string) {
    if (size <= 2) return;
    const round = knockoutLabel(size / 2);
    const next = await this.prisma.match.findFirst({
      where: { tournamentId, round, position: Math.floor(position / 2) },
    });
    if (!next) return;
    const side = position % 2 === 0 ? "teamA" : "teamB";
    if (next[side] === player) return;

    const wasPlayed = next.status === "completed";
    await this.prisma.match.update({
      where: { id: next.id },
      data: {
        [side]: player,
        ...(wasPlayed ? { status: "scheduled", scoreA: null, scoreB: null } : {}),
      },
    });
    if (wasPlayed) await this.place(tournamentId, size / 2, next.position, "");
  }

  /**
   * Once every group match has a result, seat the top two of each group in the
   * knockout: A1–B2, B1–A2, C1–D2, D1–C2, … (the pairing the public bracket
   * projects). A group whose places head-to-head can't settle is left open for
   * the admins to fill in, and a slot an admin already filled is kept.
   */
  private async fillFromGroups(tournamentId: string) {
    const rows = await this.rows(tournamentId);
    const groupRows = rows.filter((m) => m.round.startsWith("Group "));
    const groups = [...new Set(groupRows.map((m) => m.round))].sort();
    if (groups.length === 0 || !isPowerOfTwo(groups.length)) return;
    if (groupRows.some((m) => m.status !== "completed")) return;

    const top = new Map<string, { first: string; second: string }>();
    for (const g of groups) {
      const t = topTwo(rankGroup(groupRows.filter((m) => m.round === g)));
      top.set(g, "undecided" in t ? { first: "", second: "" } : t);
    }
    const entrants: string[] = [];
    if (groups.length === 1) {
      const t = top.get(groups[0])!;
      entrants.push(t.first, t.second);
    } else {
      for (let i = 0; i < groups.length; i += 2) {
        const x = top.get(groups[i])!;
        const y = top.get(groups[i + 1])!;
        entrants.push(x.first, y.second, y.first, x.second);
      }
    }

    const round = knockoutLabel(groups.length * 2);
    for (const m of rows.filter((r) => r.round === round)) {
      if (m.status === "completed") continue;
      const a = entrants[m.position * 2] ?? "";
      const b = entrants[m.position * 2 + 1] ?? "";
      const data = {
        ...(a && a !== m.teamA ? { teamA: a } : {}),
        ...(b && b !== m.teamB ? { teamB: b } : {}),
      };
      if (Object.keys(data).length > 0) {
        await this.prisma.match.update({ where: { id: m.id }, data });
      }
    }
  }

  private rows(tournamentId: string, round?: string) {
    return this.prisma.match.findMany({
      where: { tournamentId, ...(round ? { round } : {}) },
      orderBy: [{ createdAt: "asc" }, { position: "asc" }],
    });
  }

  /**
   * Each named side must be a confirmed participant, and the two must differ.
   * `allowOpen` lets a bracket slot stay empty until its player is known.
   */
  private async assertPlayers(
    tournamentId: string,
    teamA: string,
    teamB: string,
    allowOpen: boolean,
  ) {
    if (!allowOpen && (!teamA || !teamB)) {
      throw new BadRequestException("Choose both players.");
    }
    if (teamA && teamA === teamB) {
      throw new BadRequestException("A match needs two different players.");
    }
    const named = [teamA, teamB].filter(Boolean);
    const found = await this.prisma.participant.findMany({
      where: { tournamentId, status: "confirmed", team: { in: named } },
      select: { team: true },
    });
    const known = new Set(found.map((p) => p.team));
    const missing = named.find((t) => !known.has(t));
    if (missing !== undefined) {
      throw new BadRequestException(
        `"${missing}" isn't a confirmed participant of this tournament.`,
      );
    }
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
