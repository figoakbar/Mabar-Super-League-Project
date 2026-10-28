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

/**
 * Racing has no bracket, so a driver's finishing position in the *race*
 * session is read onto the same ladder: P1 champion, P2 runner-up, P3–P4 as
 * semifinalists, P5–P8 quarterfinalists, P9–P16 round of 16, anyone further
 * back as an early exit. No position at all means the driver never finished a
 * classified race (the "never played" rung).
 */
export function racePlacement(position: number | null | undefined): Placement {
  if (!position || position < 1) {
    return { wonFinal: false, lostRound: null, playedAny: false };
  }
  if (position === 1) return { wonFinal: true, lostRound: null, playedAny: true };
  const lostRound =
    position === 2
      ? "Final"
      : position <= 4
        ? "Semifinals"
        : position <= 8
          ? "Quarterfinals"
          : position <= 16
            ? "Round of 16"
            : null;
  return { wonFinal: false, lostRound, playedAny: true };
}

/** Each driver's best classified position in the race session. */
export function bestRacePositions(
  results: { driver: string; session: string; position: number | null }[],
): Map<string, number> {
  const best = new Map<string, number>();
  for (const r of results) {
    if (r.session !== "race" || !r.position) continue;
    const prev = best.get(r.driver);
    if (prev === undefined || r.position < prev) best.set(r.driver, r.position);
  }
  return best;
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
