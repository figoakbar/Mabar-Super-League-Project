import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import {
  TournamentBrowser,
  type OpenTournament,
} from "@/components/tournaments/tournament-browser";

export const metadata: Metadata = {
  title: "Tournaments",
};

const data: OpenTournament[] = [
  { id: "fc5", cat: "Football", gameLabel: "EA FC", name: "MSL Championship S5 — Late Qualifier", format: "Online · Single Elimination", accent: "#4FA3E0", prize: "Rp 5.000.000", fee: "Rp 50.000", regEnds: "22 Jul 2026", filled: 26, slots: 32 },
  { id: "gp26", cat: "Racing", gameLabel: "GRAND PRIX", name: "Grand Prix Series — Sprint Cup", format: "Online · Time Trial + Race", accent: "#4FBF8B", prize: "Rp 3.500.000", fee: "Rp 35.000", regEnds: "24 Jul 2026", filled: 14, slots: 24 },
  { id: "sc26", cat: "Tennis", gameLabel: "SMASH COURT", name: "Smash Court Open — August Edition", format: "Online · Round Robin + Knockout", accent: "#E06055", prize: "Rp 2.000.000", fee: "Rp 25.000", regEnds: "30 Jul 2026", filled: 9, slots: 16 },
  { id: "am26", cat: "Arcade", gameLabel: "ARCADE MANIA", name: "Arcade Clash Cup — Score Attack", format: "Online · Weekly Leaderboard", accent: "#E0A04F", prize: "Rp 1.500.000", fee: "Free", regEnds: "19 Jul 2026", filled: 48, slots: 64 },
  { id: "tb26", cat: "Football", gameLabel: "TURBO BALL", name: "Turbo Ball Community League S2", format: "Online · League + Playoffs", accent: "#D9479A", prize: "Rp 2.500.000", fee: "Rp 30.000", regEnds: "29 Jul 2026", filled: 16, slots: 16 },
  { id: "fl26", cat: "Football", gameLabel: "FANTASY LEAGUE", name: "Fantasy League Cup — Season 4", format: "Online · Swiss Rounds", accent: "#8E7BFF", prize: "Rp 4.000.000", fee: "Rp 40.000", regEnds: "26 Jul 2026", filled: 21, slots: 32 },
];

const star8 =
  "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)";
const heart =
  "polygon(50% 100%, 0% 40%, 0% 15%, 15% 0%, 35% 0%, 50% 15%, 65% 0%, 85% 0%, 100% 15%, 100% 40%)";

function HeroArt() {
  return (
    <div className="relative hidden h-[360px] md:block">
      {/* Ornamen */}
      <span className="absolute left-[12%] top-[8%] size-[18px] rotate-45 rounded-[4px] bg-[#FFB800] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:0.6s]" />
      <span className="absolute right-[6%] top-[16%] size-3.5 rounded-full bg-[#8E7BFF] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.4s]" />
      <span className="absolute right-[20%] top-[4%] size-3 rotate-45 rounded-[3px] bg-[#4FA3E0] opacity-45 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:2.2s]" />

      {/* Konfeti */}
      <span className="absolute left-[8%] top-[6%] size-3 rounded-[2px] bg-[#FFF0B8] [animation:confetti_2.4s_ease-in-out_infinite]" />
      <span className="absolute left-[46%] top-0 size-[9px] rounded-full bg-[#9FE8FF] [animation:confetti_2.4s_ease-in-out_infinite] [animation-delay:0.5s]" />
      <span className="absolute right-[12%] top-[10%] size-[11px] rounded-[2px] bg-[#7EE8A2] [animation:confetti_2.4s_ease-in-out_infinite] [animation-delay:1s]" />

      {/* Trofi melayang di atas podium */}
      <div className="absolute left-1/2 top-[26px] -ml-12 h-[106px] w-24 [animation:float_3.4s_ease-in-out_infinite]">
        <span className="absolute left-0 top-2 h-9 w-[26px] rounded-full border-8 border-[#B8791A]" />
        <span className="absolute right-0 top-2 h-9 w-[26px] rounded-full border-8 border-[#B8791A]" />
        <div className="absolute left-1/2 top-0 -ml-[30px] grid h-14 w-[60px] place-items-center rounded-[12px_12px_32px_32px] bg-[linear-gradient(160deg,#FFE9A8,#FFB800_60%,#C89A32)]">
          <span
            className="size-4 bg-[#B8791A]"
            style={{ clipPath: star8 }}
          />
        </div>
        <span className="absolute left-1/2 top-[54px] -ml-2 h-[18px] w-4 bg-[#B8791A]" />
        <span className="absolute left-1/2 top-[72px] -ml-5 h-[9px] w-10 rounded-[4px] bg-[#FFB800]" />
        <span className="absolute left-1/2 top-[81px] -ml-[30px] h-4 w-[60px] rounded-md bg-[#B8791A]" />
      </div>

      {/* Podium */}
      <div className="absolute bottom-[30px] left-1/2 -ml-[150px] h-[130px] w-[300px]">
        <div className="absolute bottom-0 left-0 grid h-[84px] w-24 place-items-center rounded-t-[10px] border border-white/10 bg-[#16171B]">
          <span className="font-display text-3xl font-extrabold text-[#C7CEDC]">
            2
          </span>
        </div>
        <div className="absolute bottom-0 left-[102px] grid h-[130px] w-24 place-items-center rounded-t-[10px] border border-[#FFB800]/50 bg-[#1C1D22]">
          <span className="font-display text-4xl font-extrabold text-[#FFB800]">
            1
          </span>
        </div>
        <div className="absolute bottom-0 right-0 grid h-[62px] w-24 place-items-center rounded-t-[10px] border border-white/10 bg-[#16171B]">
          <span className="font-display text-[26px] font-extrabold text-[#D98E52]">
            3
          </span>
        </div>
      </div>

      {/* Gamepad kiri */}
      <div className="absolute left-[2%] top-[34%] h-[66px] w-24 -rotate-[10deg] [animation:float_3.4s_ease-in-out_infinite] [animation-delay:0.8s]">
        <span className="absolute left-0 top-2.5 h-[46px] w-24 rounded-3xl bg-[#2E2A3E] shadow-[inset_0_-5px_0_rgba(0,0,0,0.25)]" />
        <span className="absolute left-2.5 top-1 size-7 rounded-full bg-[#2E2A3E]" />
        <span className="absolute right-2.5 top-1 size-7 rounded-full bg-[#2E2A3E]" />
        <span className="absolute left-[17px] top-[26px] h-[7px] w-5 rounded-[3px] bg-[#C6C2D6]" />
        <span className="absolute left-[23.5px] top-[19.5px] h-5 w-[7px] rounded-[3px] bg-[#C6C2D6]" />
        <span className="absolute right-6 top-[18px] size-2 rounded-full bg-[#FFF0B8]" />
        <span className="absolute right-3.5 top-[29px] size-2 rounded-full bg-[#7EE8A2]" />
        <span className="absolute right-[34px] top-[29px] size-2 rounded-full bg-[#9FE8FF]" />
        <span className="absolute right-6 top-10 size-2 rounded-full bg-[#FF8A80]" />
      </div>

      {/* Konsol kanan */}
      <div className="absolute right-0 top-[30%] h-[70px] w-[88px] rotate-[8deg] [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.6s]">
        <span className="absolute left-2.5 top-0 h-11 w-[68px] rounded-lg bg-[#2E2A3E]" />
        <div className="absolute left-[18px] top-1.5 h-[26px] w-[52px] overflow-hidden rounded-[4px] bg-[#1C1926]">
          <span className="absolute left-1.5 top-1.5 size-2 bg-[#FFB800] [animation:pulse-soft_1.4s_ease-in-out_infinite]" />
          <span className="absolute right-2 top-3 h-1.5 w-2.5 rounded-[2px] bg-[#7EE8A2] [animation:pulse-soft_1.4s_ease-in-out_infinite] [animation-delay:0.5s]" />
        </div>
        <span className="absolute left-[22px] top-9 h-[5px] w-2 rounded-[2px] bg-[#C6C2D6]" />
        <span className="absolute bottom-2 left-0 h-[34px] w-3.5 rounded-[7px] bg-[#4FA3E0]" />
        <span className="absolute bottom-2 right-0 h-[34px] w-3.5 rounded-[7px] bg-[#FF8A80]" />
      </div>

      {/* D-pad */}
      <div className="absolute bottom-[40%] left-[16%] size-[34px] opacity-55 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:2.4s]">
        <span className="absolute left-0 top-3 h-2.5 w-[34px] rounded-[3px] bg-[#8E7BFF]" />
        <span className="absolute left-3 top-0 h-[34px] w-2.5 rounded-[3px] bg-[#8E7BFF]" />
      </div>

      {/* Hati pixel */}
      <div className="absolute bottom-[36%] right-[18%] h-[26px] w-[30px] opacity-60 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.2s]">
        <span
          className="absolute inset-0 bg-[#FF8A80]"
          style={{ clipPath: heart }}
        />
      </div>

      {/* Lantai */}
      <span className="absolute inset-x-0 bottom-6 h-1.5 rounded-[3px] bg-white/[0.06]" />
    </div>
  );
}

export default function TournamentsPage() {
  const openCount = data.filter((t) => t.filled < t.slots).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/[0.08]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_90%_at_50%_30%,black_30%,transparent_100%)]"
          />
          <div className="relative z-10 mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-6 pb-[72px] pt-16 sm:px-10 md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start gap-[18px]">
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-[52px]">
                Compete. Climb.
                <br />
                Become a <span className="text-[#FFB800]">Champion</span>.
              </h1>
              <p className="max-w-[460px] text-[15.5px] font-semibold leading-[1.65] text-white/55">
                Join official MSL tournaments across football, racing, tennis,
                and arcade games. Registration takes less than a minute.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <Link
                  href="#open-tournaments"
                  className="rounded-xl bg-[#FFB800] px-[26px] py-[13px] font-display text-[15px] font-extrabold text-[#0A0B0D] transition hover:brightness-110"
                >
                  Browse Tournaments
                </Link>
                <Link
                  href="#"
                  className="rounded-xl border border-white/[0.16] px-[26px] py-[13px] font-display text-[15px] font-bold text-white transition-colors hover:bg-white/[0.06]"
                >
                  How it works
                </Link>
              </div>
              <div className="mt-2.5 flex gap-7">
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-extrabold leading-[1.2] text-white">
                    2,340
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[1px] text-white/40">
                    PLAYERS
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-extrabold leading-[1.2] text-white">
                    {openCount} events
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[1px] text-white/40">
                    OPEN NOW
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-extrabold leading-[1.2] text-[#FFB800]">
                    Rp 18.5M
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[1px] text-white/40">
                    TOTAL PRIZES
                  </span>
                </div>
              </div>
            </div>

            <HeroArt />
          </div>
        </section>

        {/* Open tournaments */}
        <section
          id="open-tournaments"
          className="mx-auto w-full max-w-[1240px] px-6 pb-20 pt-12 sm:px-10"
        >
          <TournamentBrowser data={data} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
