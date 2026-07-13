import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { leaderboard } from "@/lib/data/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          Season standings across all Mabar Super League tournaments.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
              <th className="px-4 py-3 text-right font-medium">W</th>
              <th className="px-4 py-3 text-right font-medium">L</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                Tournaments
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr
                key={entry.rank}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {entry.rank <= 3 ? (
                    <Badge
                      variant={entry.rank === 1 ? "default" : "secondary"}
                    >
                      {entry.rank}
                    </Badge>
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{entry.team}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.points.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {entry.wins}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                  {entry.losses}
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                  {entry.tournamentsPlayed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
