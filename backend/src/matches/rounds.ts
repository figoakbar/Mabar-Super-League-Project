import { BadRequestException } from "@nestjs/common";

/**
 * Round labels are not decoration: season points and trophies are read from
 * them (see leaderboard/points.util.ts), so a final called "Grand Final" or a
 * semifinal called "Semifinal" used to earn the wrong points. Every match is
 * saved under one of these exact labels.
 */
export const KNOCKOUT_ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
] as const;

const GROUP_RE = /^group\s+([a-z])$/i;

/** Common ways people write a round, mapped onto the label points use. */
const ALIASES: Record<string, string> = {
  final: "Final",
  finals: "Final",
  "grand final": "Final",
  "grand finals": "Final",
  semifinal: "Semifinals",
  semifinals: "Semifinals",
  "semi final": "Semifinals",
  "semi finals": "Semifinals",
  "semi-final": "Semifinals",
  "semi-finals": "Semifinals",
  semis: "Semifinals",
  sf: "Semifinals",
  quarterfinal: "Quarterfinals",
  quarterfinals: "Quarterfinals",
  "quarter final": "Quarterfinals",
  "quarter finals": "Quarterfinals",
  "quarter-final": "Quarterfinals",
  "quarter-finals": "Quarterfinals",
  qf: "Quarterfinals",
  "round of 16": "Round of 16",
  "last 16": "Round of 16",
  r16: "Round of 16",
  ro16: "Round of 16",
  "round of 32": "Round of 32",
  r32: "Round of 32",
  "round of 64": "Round of 64",
  r64: "Round of 64",
};

/**
 * The canonical label for a round, or a 400 explaining the choices. Accepts the
 * canonical labels in any case, common spellings ("Grand Final", "Semifinal",
 * "QF"), and group names ("Group A" … "Group Z").
 */
export function normalizeRound(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/\s+/g, " ");
  const group = GROUP_RE.exec(value);
  if (group) return `Group ${group[1].toUpperCase()}`;
  const known = ALIASES[value.toLowerCase()];
  if (known) return known;
  throw new BadRequestException(
    value
      ? `Unknown round "${value}". Use Final, Semifinals, Quarterfinals, Round of 16 / 32 / 64, or Group A–Z.`
      : "Choose a round: Final, Semifinals, Quarterfinals, Round of 16 / 32 / 64, or Group A–Z.",
  );
}

export function isGroupRound(round: string): boolean {
  return GROUP_RE.test(round.trim());
}

/**
 * A group match may end level (a draw, 1 point each); a knockout match must
 * have a winner, or nobody advances and nobody is credited.
 */
export function assertDecisive(round: string, scoreA: number, scoreB: number) {
  if (scoreA === scoreB && !isGroupRound(round)) {
    throw new BadRequestException(
      "A knockout match needs a winner. Enter the result after the tie-break — for example penalties 4–3.",
    );
  }
}
