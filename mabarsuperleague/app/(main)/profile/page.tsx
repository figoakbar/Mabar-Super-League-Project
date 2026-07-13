import type { Metadata } from "next";
import { Mail, Shield, Trophy, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { currentUser } from "@/lib/data/user";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  const user = currentUser;
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const winRate = Math.round(
    (user.stats.wins / (user.stats.wins + user.stats.losses)) * 100
  );

  const stats = [
    { icon: Trophy, label: "Tournaments", value: user.stats.tournamentsJoined },
    { icon: Shield, label: "Win rate", value: `${winRate}%` },
    { icon: Users, label: "Wins / Losses", value: `${user.stats.wins} / ${user.stats.losses}` },
    { icon: Mail, label: "Points", value: user.stats.points.toLocaleString("en-US") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{user.username} · {user.email}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{user.team}</Badge>
              <span>Member since {formatDate(user.joinedAt)}</span>
            </div>
          </div>
        </div>
        <Button variant="outline">Edit profile</Button>
      </section>

      <Separator />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="gap-2 py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold tabular-nums">
                  {value}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent matches</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-6 py-2 font-medium">Tournament</th>
                <th className="px-6 py-2 font-medium">Opponent</th>
                <th className="px-6 py-2 font-medium">Result</th>
                <th className="px-6 py-2 text-right font-medium">Score</th>
                <th className="hidden px-6 py-2 text-right font-medium sm:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {user.matchHistory.map((match) => (
                <tr key={match.id} className="border-b last:border-0">
                  <td className="px-6 py-3">{match.tournament}</td>
                  <td className="px-6 py-3 font-medium">{match.opponent}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={match.result === "win" ? "success" : "destructive"}
                    >
                      {match.result === "win" ? "Win" : "Loss"}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {match.score}
                  </td>
                  <td className="hidden px-6 py-3 text-right text-muted-foreground sm:table-cell">
                    {formatDate(match.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
