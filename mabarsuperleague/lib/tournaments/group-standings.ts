/**
 * Group-stage tables: 3 points a win, 1 a draw. Players level on points are
 * split by head-to-head — the points they took off each other — and anyone
 * still level is left for the admins to decide (Rules §3).
 *
 * Mirror of backend/src/matches/group-standings.ts, which pairs the knockout
 * from these tables; keep the two in step.
 */

export type GroupMatch = {
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
};

export type GroupRow = {
  name: string;
  w: number;
  d: number;
  l: number;
  pts: number;
  /** Points taken off the players level with them; 0 when nobody is level. */
  h2h: number;
  /** True when head-to-head can't separate this player from a neighbour. */
  tied: boolean;
};

function played(m: GroupMatch): m is GroupMatch & { scoreA: number; scoreB: number } {
  return m.status === "completed" && m.scoreA != null && m.scoreB != null;
}

/** Points each player took from the given matches. */
function pointsFrom(matches: GroupMatch[], names: Set<string>) {
  const pts = new Map<string, number>();
  for (const m of matches) {
    if (!played(m) || !names.has(m.teamA) || !names.has(m.teamB)) continue;
    const [a, b] = m.scoreA > m.scoreB ? [3, 0] : m.scoreA < m.scoreB ? [0, 3] : [1, 1];
    pts.set(m.teamA, (pts.get(m.teamA) ?? 0) + a);
    pts.set(m.teamB, (pts.get(m.teamB) ?? 0) + b);
  }
  return pts;
}

export function rankGroup(matches: GroupMatch[]): GroupRow[] {
  const rows = new Map<string, GroupRow>();
  const row = (name: string) => {
    if (!rows.has(name)) {
      rows.set(name, { name, w: 0, d: 0, l: 0, pts: 0, h2h: 0, tied: false });
    }
    return rows.get(name)!;
  };
  for (const m of matches) {
    const a = row(m.teamA);
    const b = row(m.teamB);
    if (!played(m)) continue;
    if (m.scoreA > m.scoreB) {
      a.w++;
      a.pts += 3;
      b.l++;
    } else if (m.scoreA < m.scoreB) {
      b.w++;
      b.pts += 3;
      a.l++;
    } else {
      a.d++;
      b.d++;
      a.pts++;
      b.pts++;
    }
  }

  // Bucket by points, then order each bucket by head-to-head among its members.
  const byPoints = new Map<number, GroupRow[]>();
  for (const r of rows.values()) {
    byPoints.set(r.pts, [...(byPoints.get(r.pts) ?? []), r]);
  }
  const ranked: GroupRow[] = [];
  for (const pts of [...byPoints.keys()].sort((x, y) => y - x)) {
    const level = byPoints.get(pts)!;
    if (level.length === 1) {
      ranked.push(level[0]);
      continue;
    }
    const h2h = pointsFrom(matches, new Set(level.map((r) => r.name)));
    for (const r of level) r.h2h = h2h.get(r.name) ?? 0;
    level.sort((x, y) => y.h2h - x.h2h || x.name.localeCompare(y.name));
    level.forEach((r, i) => {
      r.tied = level.some((o, j) => j !== i && o.h2h === r.h2h);
    });
    ranked.push(...level);
  }
  return ranked;
}

/**
 * The two qualifiers in order, or the names whose order is still open when
 * first and second (or second and third) can't be told apart.
 */
export function topTwo(
  ranked: GroupRow[],
): { first: string; second: string } | { undecided: string[] } {
  const undecided = new Set<string>();
  // 1st vs 2nd decides the pairing, 2nd vs 3rd decides who goes through.
  for (let i = 0; i < Math.min(2, ranked.length - 1); i++) {
    const [x, y] = [ranked[i], ranked[i + 1]];
    if (x.pts === y.pts && x.h2h === y.h2h) {
      undecided.add(x.name);
      undecided.add(y.name);
    }
  }
  if (undecided.size > 0) return { undecided: [...undecided] };
  return { first: ranked[0].name, second: ranked[1].name };
}

/**
 * How many groups a field of `players` is split into. Always 1, 2, 4, 8 … so
 * the top two of every group fill a knockout bracket exactly. Among those, the
 * split with groups of 3–6 that comes out even is preferred, then the one
 * closest to groups of 4: 12 players → 4 × 3, 9 → 5 + 4, 20 → 4 × 5. Players
 * are dealt one at a time, so groups never differ by more than one.
 */
export function groupCount(players: number): number {
  const options: number[] = [];
  for (let g = 1; g <= players; g *= 2) {
    const size = players / g;
    if (size >= 3 && size <= 6) options.push(g);
  }
  if (options.length === 0) return 1;
  const uneven = (g: number) => (players % g === 0 ? 0 : 1);
  return options.sort(
    (x, y) =>
      uneven(x) - uneven(y) ||
      Math.abs(players / x - 4) - Math.abs(players / y - 4) ||
      y - x,
  )[0];
}
