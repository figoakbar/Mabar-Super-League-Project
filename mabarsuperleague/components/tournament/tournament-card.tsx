import Link from "next/link";
import { CalendarDays, Gamepad2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Tournament } from "@/lib/types";
import { TournamentStatusBadge } from "./tournament-status-badge";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const isFull = tournament.registeredTeams >= tournament.maxTeams;

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{tournament.name}</CardTitle>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        <CardDescription className="line-clamp-2">
          {tournament.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-4" />
          {tournament.game}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          Starts {formatDate(tournament.startDate)}
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          {tournament.registeredTeams}/{tournament.maxTeams} teams
          {isFull && <Badge variant="warning">Full</Badge>}
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <div className="text-sm">
          <span className="font-semibold">
            {formatRupiah(tournament.prizePool)}
          </span>{" "}
          <span className="text-muted-foreground">prize pool</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/tournaments/${tournament.id}`} />}
        >
          View details
        </Button>
      </CardFooter>
    </Card>
  );
}
