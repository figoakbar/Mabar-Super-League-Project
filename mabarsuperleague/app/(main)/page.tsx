import Link from "next/link";

import {
  RecordsSlider,
  type GameRecord,
} from "@/components/home/records-slider";
import {
  TournamentTabs,
  type TournamentEntry,
} from "@/components/home/tournament-tabs";
import { getSession } from "@/lib/auth/session";

const games: GameRecord[] = [
  { name: "EA FC", sub: "Rivals Division", w: 10, l: 5, rate: 67, accent: "#4FA3E0" },
  { name: "Fantasy League", sub: "Football", w: 14, l: 8, rate: 64, accent: "#8E7BFF" },
  { name: "Smash Court", sub: "Tennis", w: 7, l: 9, rate: 44, accent: "#E06055" },
  { name: "Grand Prix", sub: "Motorsport", w: 12, l: 3, rate: 80, accent: "#4FBF8B" },
  { name: "Arcade Mania", sub: "Gaming", w: 21, l: 12, rate: 64, accent: "#E0A04F" },
  { name: "Turbo Ball", sub: "3v3 Arena", w: 6, l: 6, rate: 50, accent: "#D9479A" },
];

const confirmed = {
  status: "Confirmed",
  statusBg: "rgba(111,207,151,0.12)",
  statusColor: "#6FCF97",
};
const pending = {
  status: "Pending",
  statusBg: "rgba(255,184,0,0.12)",
  statusColor: "#FFB800",
};

const ongoing: TournamentEntry[] = [
  {
    tag: "FC",
    accent: "#4FA3E0",
    gameLabel: "EA FC",
    name: "MSL Championship S5",
    ...confirmed,
    stage: "GROUP STAGE · GROUP A",
    recordVal: "2–0",
    recordRest: "Rank 1 of 4",
  },
  {
    tag: "GP",
    accent: "#4FBF8B",
    gameLabel: "GRAND PRIX",
    name: "Grand Prix Series 2026",
    ...confirmed,
    stage: "QUALIFYING · ROUND 2",
    recordVal: "3–1",
    recordRest: "Top 8",
  },
  {
    tag: "AM",
    accent: "#E0A04F",
    gameLabel: "ARCADE MANIA",
    name: "Arcade Clash Cup",
    ...pending,
    note: "Payment proof under review — slot confirmed after verification.",
  },
];

const past: TournamentEntry[] = [
  {
    tag: "FC",
    accent: "#4FA3E0",
    gameLabel: "EA FC",
    name: "MSL Championship S4",
    status: "Champion",
    statusBg: "rgba(255,184,0,0.12)",
    statusColor: "#FFB800",
    stage: "KNOCKOUT · FINAL",
    recordVal: "6–1",
    recordRest: "1st of 32",
  },
  {
    tag: "TB",
    accent: "#D9479A",
    gameLabel: "TURBO BALL",
    name: "Community League 2025",
    status: "Runner-up",
    statusBg: "rgba(199,206,220,0.1)",
    statusColor: "#C7CEDC",
    stage: "KNOCKOUT · FINAL",
    recordVal: "4–2",
    recordRest: "2nd of 16",
  },
  {
    tag: "SC",
    accent: "#E06055",
    gameLabel: "SMASH COURT",
    name: "Tennis Open Cup",
    status: "Semifinal",
    statusBg: "rgba(255,255,255,0.08)",
    statusColor: "rgba(255,255,255,0.6)",
    stage: "KNOCKOUT · SEMIFINAL",
    recordVal: "3–2",
    recordRest: "Top 4",
  },
];

const matches = [
  { res: "W", opponent: "DimasFC_99", sub: "MSL Championship S5 · Matchday 2", score: "3–1", date: "12 Jul" },
  { res: "W", opponent: "SpeedKing_ID", sub: "Grand Prix Series · Qualifying R2", score: "P1", date: "10 Jul" },
  { res: "L", opponent: "AceHunter", sub: "Tennis Open Cup · Group", score: "1–2", date: "8 Jul" },
  { res: "W", opponent: "PixelQueen", sub: "Arcade Clash Cup · Round 1", score: "48,200 pts", date: "6 Jul" },
  { res: "L", opponent: "GoalMachine", sub: "MSL Championship S5 · Matchday 1", score: "2–3", date: "3 Jul" },
  { res: "W", opponent: "CaptainStrike", sub: "Fantasy League · Week 12", score: "2–0", date: "1 Jul" },
];

const totalW = games.reduce((a, g) => a + g.w, 0);
const totalL = games.reduce((a, g) => a + g.l, 0);

function MatchBadge({ res, size = "md" }: { res: string; size?: "sm" | "md" }) {
  const win = res === "W";
  return (
    <span
      className={`grid place-items-center font-extrabold ${
        size === "sm"
          ? "size-5 rounded-[4px] text-[10px]"
          : "size-8 rounded-md text-[13px]"
      }`}
      style={{
        background: win ? "rgba(111,207,151,0.14)" : "rgba(224,122,114,0.14)",
        color: win ? "#6FCF97" : "#E07A72",
      }}
    >
      {res}
    </span>
  );
}

export default async function HomePage() {
  const session = await getSession();
  const username = session?.username ?? "Player";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-10">
      {/* Profile header */}
      <section className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-[18px]">
          <div className="grid size-[72px] place-items-center rounded-lg border border-white/10 bg-[#16171B]">
            <span className="font-display text-[28px] font-bold text-[#FFB800]">
              {initials}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-3xl font-bold leading-none tracking-[1px] text-white sm:text-[40px]">
              Hi, {username}
            </h1>
            <span className="text-[13px] font-semibold text-white/45">
              Member since 2024 · Jakarta, ID
            </span>
          </div>
        </div>

        <div className="flex gap-8 rounded-[10px] border border-white/[0.08] bg-[#101114] px-7 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#6FCF97]">
              {totalW}
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              WINS
            </span>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#E07A72]">
              {totalL}
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              LOSSES
            </span>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[26px] font-bold leading-none text-[#FFB800]">
              5
            </span>
            <span className="text-[11px] font-bold tracking-[1.2px] text-white/40">
              TROPHIES
            </span>
          </div>
        </div>
      </section>

      {/* Competition records */}
      <RecordsSlider games={games} />

      {/* Tournaments + match history */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <TournamentTabs ongoing={ongoing} past={past} />

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
              Match History
            </h2>
            <div className="flex gap-[5px]">
              {matches.map((m, i) => (
                <MatchBadge key={i} res={m.res} size="sm" />
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-[10px] border border-white/[0.08] bg-[#101114] px-5 py-1">
            {matches.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 border-b border-white/[0.05] py-[13px]"
              >
                <MatchBadge res={m.res} />
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="text-sm font-extrabold text-white">
                    vs {m.opponent}
                  </span>
                  <span className="truncate text-[11.5px] font-semibold text-white/40">
                    {m.sub}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-px">
                  <span className="font-display text-base font-bold text-white">
                    {m.score}
                  </span>
                  <span className="text-[11px] font-semibold text-white/35">
                    {m.date}
                  </span>
                </div>
              </div>
            ))}
            <div className="py-[13px] text-center">
              <Link
                href="/profile"
                className="text-[12.5px] font-extrabold tracking-[0.5px] text-[#FFB800] hover:text-[#FFDD66] hover:underline"
              >
                VIEW FULL HISTORY →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
