/** Season-points math, shared by the leaderboard and per-game player records. */

/** Tier weight multiplies the points a placement is worth. */
export const TIER_WEIGHT: Record<string, number> = {
  minor: 1,
  major: 2,
  championship: 3,
};

export type Placement = {
  wonFinal: boolean;
  lostRound: string | null;
  playedAny: boolean;
};

/** Base points for a player's finishing placement in one tournament. */
export function placementPoints(p: Placement): number {
  if (p.wonFinal) return 100; // Champion
  if (p.lostRound === "Final") return 60; // Runner-up
  if (p.lostRound === "Semifinals") return 35;
  if (p.lostRound === "Quarterfinals") return 20;
  if (p.lostRound === "Round of 16") return 12;
  if (p.playedAny) return 8; // group stage / earlier exit
  return 3; // confirmed but never played a completed match
}

/** Bigger fields are worth a little more (√ scaled, capped at ×2). */
export function fieldMultiplier(participantCount: number): number {
  const count = participantCount || 8;
  return Math.min(2, Math.max(1, Math.sqrt(count / 8)));
}

/** Season points a placement earns, given the tournament's tier and field. */
export function tournamentPoints(
  placement: Placement,
  tier: string,
  participantCount: number,
): number {
  if (tier === "exhibition") return 0; // friendlies award nothing
  return Math.round(
    placementPoints(placement) *
      (TIER_WEIGHT[tier] ?? 1) *
      fieldMultiplier(participantCount),
  );
}
