import type { Metadata } from "next";

import { PlayersBrowser } from "@/components/players/players-browser";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Players",
};

export default async function PlayersPage() {
  const session = await getSession();
  const username = session?.username ?? "Player";

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />
      <main className="flex-1">
        <PlayersBrowser username={username} />
      </main>
      <SiteFooter />
    </div>
  );
}
