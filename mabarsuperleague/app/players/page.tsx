import type { Metadata } from "next";

import { PlayersBrowser } from "@/components/players/players-browser";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { api, type PublicPlayer } from "@/lib/admin/api";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Players",
};

export default async function PlayersPage() {
  const user = await getCurrentUser();

  let players: PublicPlayer[] = [];
  try {
    players = await api.listPlayers();
  } catch {
    // Backend unreachable — render an empty directory rather than crashing.
    players = [];
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />
      <main className="flex-1">
        <PlayersBrowser players={players} currentUser={user?.username ?? null} />
      </main>
      <SiteFooter />
    </div>
  );
}
