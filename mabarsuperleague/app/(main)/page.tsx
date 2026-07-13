import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getSession } from "@/lib/auth/session";

const gameRecords = [
  { tag: "FC", game: "EA FC 25", record: "10–5", achievement: "Season 3 Champion" },
  { tag: "VL", game: "Valorant", record: "6–4", achievement: "Spike Showdown Semifinalist" },
  { tag: "ML", game: "Mobile Legends", record: "3–5", achievement: "Clash Cup Group Stage" },
  { tag: "TK", game: "Tekken 8", record: "4–3", achievement: "Iron Fist Quarterfinalist" },
  { tag: "PM", game: "PUBG Mobile", record: "2–2", achievement: "Battleground Royale Top 10" },
];

type MyTournament = {
  tag: string;
  game: string;
  name: string;
  status: "Confirmed" | "Pending Verification";
  stage?: string;
  record?: string;
  standing?: string;
  note?: string;
};

const myTournaments: MyTournament[] = [
  {
    tag: "FC",
    game: "EA FC 25",
    name: "FC Pro League — Season 4",
    status: "Confirmed",
    stage: "GROUP STAGE · GROUP A",
    record: "2–0",
    standing: "Rank 1 of 4",
  },
  {
    tag: "VL",
    game: "Valorant",
    name: "Spike Showdown",
    status: "Confirmed",
    stage: "KNOCKOUT · QUARTERFINALS",
    record: "3–1",
    standing: "Top 8",
  },
  {
    tag: "ML",
    game: "Mobile Legends",
    name: "MLBB Clash Cup",
    status: "Pending Verification",
    note: "Payment proof is under admin review — your slot will be confirmed automatically after verification.",
  },
];

const matchHistory = [
  { result: "W", opponent: "NightOwl", context: "FC Pro League S4 · Matchday 2", score: "3–1", date: "10 Jul" },
  { result: "W", opponent: "Razor", context: "FC Pro League S4 · Matchday 1", score: "2–0", date: "08 Jul" },
  { result: "L", opponent: "Blaze", context: "Spike Showdown · Group", score: "1–2", date: "06 Jul" },
  { result: "W", opponent: "Titan", context: "Spike Showdown · Group", score: "2–1", date: "05 Jul" },
  { result: "W", opponent: "Comet", context: "Weekend Knockout · Final", score: "3–0", date: "28 Jun" },
  { result: "W", opponent: "Drift", context: "Weekend Knockout · Semifinal", score: "2–1", date: "28 Jun" },
];

function ResultBadge({
  result,
  size = "md",
}: {
  result: string;
  size?: "sm" | "md";
}) {
  const win = result === "W";
  return (
    <span
      className={`flex items-center justify-center rounded-md font-display font-bold ${
        size === "sm" ? "size-6 text-xs" : "size-10 text-sm"
      } ${
        win
          ? "bg-[#5bffa8]/15 text-[#5bffa8]"
          : "bg-[#ff7a7a]/15 text-[#ff7a7a]"
      }`}
    >
      {result}
    </span>
  );
}

function GameTag({ tag }: { tag: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2d6bff]/40 to-[#4dd8f0]/20 font-display text-xs font-bold text-[#4dd8f0]">
      {tag}
    </span>
  );
}

export default async function HomePage() {
  const session = await getSession();
  const username = session?.username ?? "Player";

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome */}
      <section className="flex items-start gap-5">
        <span className="hidden size-20 shrink-0 rounded-2xl border-2 border-[#4dd8f0] bg-[repeating-linear-gradient(135deg,#1a1130_0_10px,#231543_10px_20px)] shadow-[0_0_22px_rgba(77,216,240,.35)] sm:block" />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-white">
              Hi, {username} 👋
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-[#9b8fc0]">
            Here are the tournaments you&apos;re currently in and your latest
            match results.
          </p>
        </div>
      </section>

      {/* Game records */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold tracking-[3px] text-[#b06bc4]">
            GAME RECORDS
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#9b8fc0] hover:text-white"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#9b8fc0] hover:text-white"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {gameRecords.map((g) => (
            <article
              key={g.game}
              className="rounded-2xl border border-white/[0.07] bg-[#120b22] p-5"
            >
              <div className="flex items-center gap-3">
                <GameTag tag={g.tag} />
                <span className="font-display text-[15px] font-semibold text-white">
                  {g.game}
                </span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-white">
                {g.record}
              </p>
              <p className="mt-1 text-[11px] font-semibold tracking-[2px] text-[#6f6493]">
                W–L RECORD
              </p>
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-[#ffc75b]/25 bg-[#ffc75b]/[0.08] px-3 py-2 text-[13px] font-semibold text-[#ffc75b]">
                <span aria-hidden>🏆</span>
                {g.achievement}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Tournaments + Match history */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
        {/* My tournaments */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-white">
              My Tournaments
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-[#ffc75b] bg-[#ffc75b]/15 px-4 py-1.5 font-display text-sm font-bold text-[#ffc75b]"
              >
                Ongoing
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 font-display text-sm font-medium text-[#9b8fc0] hover:text-white"
              >
                Past
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {myTournaments.map((t) => (
              <article
                key={t.name}
                className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#120b22]"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <GameTag tag={t.tag} />
                    <div>
                      <p className="font-display text-xs font-bold tracking-[2px] text-[#4dd8f0]">
                        {t.game.toUpperCase()}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                        {t.name}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-3 py-1.5 font-display text-xs font-bold ${
                      t.status === "Confirmed"
                        ? "bg-[#5bffa8]/15 text-[#5bffa8]"
                        : "bg-[#ffc75b]/15 text-[#ffc75b]"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {t.stage ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-[#ff2d95]/[0.05] px-5 py-3">
                    <p className="font-display text-xs font-bold tracking-[2px] text-[#ff5cb0]">
                      {t.stage}
                    </p>
                    <p className="text-sm text-[#9b8fc0]">
                      Record:{" "}
                      <span className="font-bold text-[#4dd8f0]">
                        {t.record}
                      </span>{" "}
                      · {t.standing}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02] px-5 py-3.5 text-sm text-[#9b8fc0]">
                    <span aria-hidden>⏳</span>
                    {t.note}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Match history */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-white">
              Match History
            </h2>
            <div className="flex gap-1.5">
              {matchHistory.map((m, i) => (
                <ResultBadge key={i} result={m.result} size="sm" />
              ))}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-[#120b22] px-5">
            {matchHistory.map((m, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <ResultBadge result={m.result} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-bold text-white">
                    vs {m.opponent}
                  </p>
                  <p className="truncate text-[13px] text-[#9b8fc0]">
                    {m.context}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[15px] font-bold text-white">
                    {m.score}
                  </p>
                  <p className="text-xs text-[#6f6493]">{m.date}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center">
            <Link
              href="/profile"
              className="font-display text-sm font-bold text-[#4dd8f0] hover:underline"
            >
              View full history →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
