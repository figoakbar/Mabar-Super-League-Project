import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { TournamentDetail } from "@/components/tournaments/tournament-detail";
import { TournamentLive } from "@/components/tournaments/tournament-live";
import { api, type TournamentDetail as TournamentDetailData } from "@/lib/admin/api";
import { getCurrentUser } from "@/lib/auth/dal";

async function loadTournament(
  id: string,
): Promise<TournamentDetailData | null> {
  try {
    return await api.getTournament(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await loadTournament(id);
  return { title: t ? t.name : "Tournament" };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await loadTournament(id);
  if (!tournament) notFound();

  const user = await getCurrentUser();
  const username = user?.username ?? "Player";

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />
      <main className="flex-1">
        {tournament.status === "open" ? (
          <TournamentDetail t={tournament} username={username} />
        ) : (
          <TournamentLive t={tournament} username={username} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
