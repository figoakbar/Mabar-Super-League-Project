import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Coins,
  Gamepad2,
  MapPin,
  Swords,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { getTournamentById, tournaments } from "@/lib/data/tournaments";
import { formatDate, formatRupiah } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return tournaments.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tournament = getTournamentById(id);
  return { title: tournament?.name ?? "Tournament not found" };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const tournament = getTournamentById(id);

  if (!tournament) notFound();

  const isFull = tournament.registeredTeams >= tournament.maxTeams;
  const canRegister = tournament.status === "open" && !isFull;

  const facts = [
    { icon: Gamepad2, label: "Game", value: tournament.game },
    { icon: Swords, label: "Format", value: tournament.format },
    {
      icon: Users,
      label: "Teams",
      value: `${tournament.registeredTeams}/${tournament.maxTeams} registered`,
    },
    {
      icon: Coins,
      label: "Entry fee",
      value: formatRupiah(tournament.entryFee),
    },
    {
      icon: CalendarDays,
      label: "Registration deadline",
      value: formatDate(tournament.registrationDeadline),
    },
    { icon: MapPin, label: "Location", value: tournament.location },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <TournamentStatusBadge status={tournament.status} />
        <h1 className="text-3xl font-semibold tracking-tight">
          {tournament.name}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {tournament.description}
        </p>
        <div className="flex items-center gap-4 pt-2">
          <Button disabled={!canRegister}>
            {canRegister
              ? "Register your team"
              : isFull && tournament.status === "open"
                ? "Tournament full"
                : "Registration closed"}
          </Button>
          <div className="text-sm">
            <span className="font-semibold">
              {formatRupiah(tournament.prizePool)}
            </span>{" "}
            <span className="text-muted-foreground">prize pool</span>
          </div>
        </div>
      </section>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tournament info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">{label}</div>
                  <div className="font-medium">{value}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {tournament.schedule.map((item) => (
                <li key={item.stage} className="flex items-start gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="text-sm">
                    <div className="font-medium">{item.stage}</div>
                    <div className="text-muted-foreground">
                      {formatDate(item.date)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground">
              {tournament.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
