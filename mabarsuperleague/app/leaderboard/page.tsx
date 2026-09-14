import type { Metadata } from "next";

import { LeaderboardBoard } from "@/components/leaderboard/leaderboard-board";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const username = user?.username ?? "Player";

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />
      <main className="flex-1">
        <LeaderboardBoard username={username} />
      </main>
      <SiteFooter />
    </div>
  );
}
