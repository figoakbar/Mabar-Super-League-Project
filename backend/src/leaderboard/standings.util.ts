import { tournamentPoints } from "./points.util";

/** One ranked row on a season leaderboard. */
export type LeaderboardEntry = {
  username: string;
  avatarUrl: string;
  points: number;
  wins: number;
  losses: number;
  mainGame: string;
  tournaments: number;
};

/** Minimal completed-tournament shape the ranking needs (one season's worth). */
export type StandingsTournament = {
  game: string;
  tier: string;
  participants: { team: string }[];
  matches: {
    teamA: string;
    teamB: string;
    scoreA: number | null;
    scoreB: number | null;
    round: string;
  }[];
};

export type SeasonStandings = {
  /** Points combined across every game. */
  overall: LeaderboardEntry[];
  /** Ranking within each game, keyed by game name. */
  byGame: Map<string, LeaderboardEntry[]>;
};

type Tally = { points: number; wins: number; losses: number; tournaments: number };
type PlayerAgg = { total: Tally; byGame: Map<string, Tally> };
const emptyTally = (): Tally => ({ points: 0, wins: 0, losses: 0, tournaments: 0 });

/**
 * Rank players for a single season's completed tournaments. Points come from
 * real placements (champion / runner-up / …) weighted by tier and field size
 * via `tournamentPoints`. Returns both the overall ranking and a per-game one.
 *
 * Shared by the public leaderboard and the season champion snapshot so the
 * maths lives in exactly one place.
 */
export function aggregateSeason(
  tournaments: StandingsTournament[],
  userSet: Set<string>,
  avatarByName: Map<string, string>,
): SeasonStandings {
  const byPlayer = new Map<string, PlayerAgg>();
  const ensure = (name: string): PlayerAgg => {
    let a = byPlayer.get(name);
    if (!a) {
      a = { total: emptyTally(), byGame: new Map() };
      byPlayer.set(name, a);
    }
    return a;
  };

  for (const t of tournaments) {
    // Exhibition tournaments are friendlies — they award no season points.
    if (t.tier === "exhibition") continue;
    const fieldCount = t.participants.length;

    // Per-player placement state within this tournament.
    type PT = {
      wins: number;
      losses: number;
      lostRound: string | null;
      wonFinal: boolean;
      playedAny: boolean;
    };
    const pt = new Map<string, PT>();
    const ensurePT = (name: string): PT => {
      let p = pt.get(name);
      if (!p) {
        p = { wins: 0, losses: 0, lostRound: null, wonFinal: false, playedAny: false };
        pt.set(name, p);
      }
      return p;
    };

    for (const p of t.participants) if (userSet.has(p.team)) ensurePT(p.team);

    for (const m of t.matches) {
      const sides: [string, number, number][] = [
        [m.teamA, m.scoreA as number, m.scoreB as number],
        [m.teamB, m.scoreB as number, m.scoreA as number],
      ];
      for (const [name, own, opp] of sides) {
        if (!userSet.has(name) || own === opp) continue;
        const p = ensurePT(name);
        p.playedAny = true;
        if (own > opp) {
          p.wins++;
          if (m.round === "Final") p.wonFinal = true;
        } else {
          p.losses++;
          p.lostRound = m.round || p.lostRound;
        }
      }
    }

    for (const [name, p] of pt) {
      const sp = tournamentPoints(
        { wonFinal: p.wonFinal, lostRound: p.lostRound, playedAny: p.playedAny },
        t.tier,
        fieldCount,
      );
      const agg = ensure(name);
      let gameTally = agg.byGame.get(t.game);
      if (!gameTally) {
        gameTally = emptyTally();
        agg.byGame.set(t.game, gameTally);
      }
      // Roll the result into both the overall tally and this game's tally.
      for (const tally of [agg.total, gameTally]) {
        tally.points += sp;
        tally.wins += p.wins;
        tally.losses += p.losses;
        tally.tournaments += 1;
      }
    }
  }

  const row = (name: string, tally: Tally, mainGame: string): LeaderboardEntry => ({
    username: name,
    avatarUrl: avatarByName.get(name) ?? "",
    points: tally.points,
    wins: tally.wins,
    losses: tally.losses,
    mainGame,
    tournaments: tally.tournaments,
  });
  const sortEntries = (list: LeaderboardEntry[]) =>
    list.sort(
      (x, y) =>
        y.points - x.points ||
        y.wins - x.wins ||
        x.username.localeCompare(y.username),
    );

  const overall: LeaderboardEntry[] = [];
  const byGame = new Map<string, LeaderboardEntry[]>();
  for (const [name, a] of byPlayer) {
    // Overall row headlines the game the player scored most points in.
    let mainGame = "";
    let best = -1;
    for (const [g, tally] of a.byGame) {
      if (tally.points > best) {
        best = tally.points;
        mainGame = g;
      }
    }
    overall.push(row(name, a.total, mainGame));
    for (const [g, tally] of a.byGame) {
      let list = byGame.get(g);
      if (!list) {
        list = [];
        byGame.set(g, list);
      }
      list.push(row(name, tally, g));
    }
  }
  sortEntries(overall);
  for (const list of byGame.values()) sortEntries(list);

  return { overall, byGame };
}
