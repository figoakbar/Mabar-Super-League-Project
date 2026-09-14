import type { Metadata } from "next";
import Link from "next/link";

import { FaqAccordion } from "@/components/how-to-play/faq-accordion";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export const metadata: Metadata = {
  title: "How to Play",
};

const steps = [
  {
    n: "01",
    icon: "account",
    accent: "#4FA3E0",
    accentBorder: "rgba(79,163,224,0.45)",
    iconBg: "rgba(79,163,224,0.1)",
    delay: "0s",
    title: "Create your account",
    text: "Sign up free with your email and a username, then add your gamer IDs (PSN, Xbox, Steam, Epic or Riot) so opponents can find you.",
  },
  {
    n: "02",
    icon: "pick",
    accent: "#8E7BFF",
    accentBorder: "rgba(142,123,255,0.45)",
    iconBg: "rgba(142,123,255,0.1)",
    delay: "0.4s",
    title: "Pick a tournament",
    text: "Browse open tournaments — check the game, platforms, format, tier and entry fee — then register before registration closes.",
  },
  {
    n: "03",
    icon: "pay",
    accent: "#FFB800",
    accentBorder: "rgba(255,184,0,0.45)",
    iconBg: "rgba(255,184,0,0.1)",
    delay: "0.8s",
    title: "Pay & upload receipt",
    text: "Transfer the entry fee to the official account, then upload your payment receipt on the tournament page.",
  },
  {
    n: "04",
    icon: "verified",
    accent: "#6FCF97",
    accentBorder: "rgba(111,207,151,0.45)",
    iconBg: "rgba(111,207,151,0.1)",
    delay: "1.2s",
    title: "Get verified",
    text: "Admin confirms your payment within 1×24 hours — your slot is locked and you're in the bracket.",
  },
];

const flow = [
  {
    n: "1",
    title: "Wait for the draw",
    text: "Once registration closes, the groups or bracket are drawn from the confirmed players. Your matchups then appear on the tournament page.",
    dotBg: "rgba(255,184,0,0.12)",
    dotBorder: "rgba(255,184,0,0.4)",
    dotColor: "#FFB800",
  },
  {
    n: "2",
    title: "Play your matches",
    text: "Follow the schedule on the tournament page. Group & Knockout events run a round-robin group stage first, and the top finishers of each group advance to the knockout.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "3",
    title: "Report your result to an admin",
    text: "After each match, send an admin your result — a screenshot, the final score, and who won. The admin records it, and the bracket, standings and your player record then update automatically.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "4",
    title: "Advance through the knockout",
    text: "The knockout stage is single elimination — win and you move on, lose and you're out, all the way to the final.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "5",
    title: "Earn prizes & season points",
    text: "Champions take the prize pool. Every result also earns season points based on how far you place — climb the seasonal leaderboard and your player profile.",
    dotBg: "rgba(111,207,151,0.12)",
    dotBorder: "rgba(111,207,151,0.4)",
    dotColor: "#6FCF97",
  },
];

// Base points per placement — the leaderboard multiplies these by the
// tournament tier (Minor ×1 · Major ×2 · Championship ×3) and bracket size.
const points = [
  { label: "Champion", pts: "100", color: "#FFB800" },
  { label: "Runner-up", pts: "60", color: "#C7CEDC" },
  { label: "Semifinalist", pts: "35", color: "#D98E52" },
  { label: "Quarterfinalist", pts: "20", color: "rgba(255,255,255,0.7)" },
  { label: "Round of 16", pts: "12", color: "rgba(255,255,255,0.7)" },
  { label: "Group stage / early exit", pts: "8", color: "rgba(255,255,255,0.7)" },
];

// The four tournament tiers. The multiplier scales every placement's points;
// `champ` is what a champion of a base 8-player bracket earns (100 × weight).
const tiers = [
  {
    name: "Minor",
    badge: "×1 POINTS",
    desc: "Everyday and weekly tournaments. Points count at their base value — the easiest way to start climbing the ladder.",
    champ: "100 pts",
    accent: "#4FA3E0",
    accentBorder: "rgba(79,163,224,0.45)",
    iconBg: "rgba(79,163,224,0.1)",
  },
  {
    name: "Major",
    badge: "×2 POINTS",
    desc: "Bigger, higher-stakes events. Every placement is worth double the season points of a Minor.",
    champ: "200 pts",
    accent: "#8E7BFF",
    accentBorder: "rgba(142,123,255,0.45)",
    iconBg: "rgba(142,123,255,0.1)",
  },
  {
    name: "Championship",
    badge: "×3 POINTS",
    desc: "The flagship, season-defining tournaments. Points count triple — this is where champions are made.",
    champ: "300 pts",
    accent: "#FFB800",
    accentBorder: "rgba(255,184,0,0.45)",
    iconBg: "rgba(255,184,0,0.1)",
  },
  {
    name: "Exhibition",
    badge: "NO POINTS",
    desc: "Casual, just-for-fun matchups. They award no season points and don't affect the leaderboard at all.",
    champ: "0 pts",
    accent: "rgba(255,255,255,0.45)",
    accentBorder: "rgba(255,255,255,0.15)",
    iconBg: "rgba(255,255,255,0.04)",
  },
];

function StepIcon({ icon, accent }: { icon: string; accent: string }) {
  switch (icon) {
    case "account":
      return (
        <>
          <span
            className="absolute left-1/2 top-3.5 -ml-[9px] size-[18px] rounded-full"
            style={{ background: accent }}
          />
          <span
            className="absolute bottom-3 left-1/2 -ml-3.5 h-[15px] w-7 rounded-[14px_14px_4px_4px]"
            style={{ background: accent }}
          />
        </>
      );
    case "pick":
      return (
        <>
          <span
            className="absolute left-3 top-[22px] h-[22px] w-[42px] rounded-xl"
            style={{ background: accent }}
          />
          <span className="absolute left-[19px] top-7 h-1 w-2.5 rounded-[2px] bg-[#0A0B0D]" />
          <span className="absolute left-[22px] top-[25px] h-2.5 w-1 rounded-[2px] bg-[#0A0B0D]" />
          <span className="absolute right-5 top-[27px] size-[5px] rounded-full bg-[#0A0B0D]" />
          <span className="absolute right-[26px] top-[34px] size-[5px] rounded-full bg-[#0A0B0D]" />
        </>
      );
    case "pay":
      return (
        <>
          <span
            className="absolute left-[13px] top-4 h-[26px] w-10 rounded-md"
            style={{ background: accent }}
          />
          <span className="absolute left-[13px] top-[22px] h-[5px] w-10 bg-[#0A0B0D]" />
          <span
            className="absolute bottom-3 left-[19px] h-1 w-5 rounded-[2px] opacity-60"
            style={{ background: accent }}
          />
          <span
            className="absolute bottom-3 right-[13px] h-1 w-2 rounded-[2px] opacity-60"
            style={{ background: accent }}
          />
        </>
      );
    default:
      return (
        <>
          <span
            className="absolute inset-3.5 rounded-full border-4"
            style={{ borderColor: accent }}
          />
          <span
            className="absolute left-[22px] top-[30px] h-1 w-2.5 rotate-45 rounded-[2px]"
            style={{ background: accent }}
          />
          <span
            className="absolute left-7 top-[27px] h-1 w-[17px] -rotate-[50deg] rounded-[2px]"
            style={{ background: accent }}
          />
        </>
      );
  }
}

export default function HowToPlayPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-white/[0.08]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_30%,transparent_100%)]"
          />
          <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col items-center gap-2.5 px-6 py-12 text-center sm:px-10">
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-[42px]">
              How to <span className="text-[#FFB800]">Play</span>
            </h1>
            <p className="max-w-[520px] text-[15px] font-semibold leading-[1.65] text-white/55">
              From sign-up to lifting the trophy — here&apos;s everything you
              need to join your first IAGL tournament.
            </p>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-6 pb-20 pt-11 sm:px-10">
          {/* Spirit of IAGL — friendly, for fun, not cut-throat */}
          <div className="flex items-start gap-3.5 rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/[0.06] px-5 py-4">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#FFB800]/15 font-display text-sm font-extrabold text-[#FFB800]">
              ★
            </span>
            <p className="text-[14px] font-semibold leading-[1.65] text-white/65">
              <span className="font-extrabold text-[#FFB800]">
                Play for fun and respect.
              </span>{" "}
              IAGL tournaments are friendly — they&apos;re about enjoying the game
              together, not serious competition. Play your best, be a good sport,
              and treat your opponents well.
            </p>
          </div>

          {/* Steps */}
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-2xl font-extrabold text-white">
              Register in 4 steps
            </h2>
            <div className="relative grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              <div
                aria-hidden
                className="pointer-events-none absolute left-[8%] right-[8%] top-[52px] hidden h-0.5 bg-[repeating-linear-gradient(90deg,rgba(255,184,0,0.35)_0_8px,transparent_8px_16px)] lg:block"
              />
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="relative flex flex-col items-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#14151A] to-[#101114] px-[22px] pb-6 text-center transition duration-300 hover:-translate-y-2 hover:shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: s.accent }}
                  />
                  <div className="absolute right-4 top-2.5 font-display text-[56px] font-extrabold leading-none text-white/5">
                    {s.n}
                  </div>
                  <div
                    className="relative mt-[26px] size-[66px] rounded-[20px] border [animation:float_3s_ease-in-out_infinite]"
                    style={{
                      background: s.iconBg,
                      borderColor: s.accentBorder,
                      animationDelay: s.delay,
                    }}
                  >
                    <StepIcon icon={s.icon} accent={s.accent} />
                  </div>
                  <span className="font-display text-[17px] font-extrabold text-white">
                    {s.title}
                  </span>
                  <span className="text-[13.5px] font-semibold leading-[1.65] text-white/55">
                    {s.text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Competing flow */}
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-2xl font-extrabold text-white">
              Competing in a tournament
            </h2>
            <div className="flex flex-col rounded-[14px] border border-white/[0.08] bg-[#101114] px-5 py-2 sm:px-7">
              {flow.map((f, i) => (
                <div
                  key={f.n}
                  className="flex gap-[18px] border-b border-white/[0.05] py-[18px] last:border-0"
                >
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <div
                      className="grid size-[34px] place-items-center rounded-full border font-display text-[13px] font-extrabold"
                      style={{
                        background: f.dotBg,
                        borderColor: f.dotBorder,
                        color: f.dotColor,
                      }}
                    >
                      {f.n}
                    </div>
                    {i < flow.length - 1 && (
                      <div className="w-0.5 flex-1 bg-white/[0.08]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 pb-1">
                    <span className="text-[15px] font-extrabold text-white">
                      {f.title}
                    </span>
                    <span className="text-[13.5px] font-semibold leading-[1.65] text-white/55">
                      {f.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tournament tiers */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-2xl font-extrabold text-white">
                Tournament tiers &amp; points
              </h2>
              <p className="max-w-[680px] text-[13.5px] font-semibold leading-[1.65] text-white/55">
                Every tournament has a tier that decides how much its season
                points are worth. The further you place, the more you earn — and
                a higher tier multiplies all of it.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map((t) => (
                <div
                  key={t.name}
                  className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101114] p-5"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: t.accent }}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-display text-[17px] font-extrabold text-white">
                      {t.name}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold tracking-[0.5px]"
                      style={{
                        borderColor: t.accentBorder,
                        background: t.iconBg,
                        color: t.accent,
                      }}
                    >
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold leading-[1.6] text-white/55">
                    {t.desc}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.5px] text-white/35">
                      Champion earns
                    </span>
                    <span
                      className="font-display text-[15px] font-extrabold"
                      style={{ color: t.accent }}
                    >
                      {t.champ}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#101114] px-6 py-5">
              <span className="font-display text-[15px] font-extrabold text-white">
                How your points add up
              </span>
              <p className="text-[13.5px] font-semibold leading-[1.7] text-white/55">
                Season points ={" "}
                <span className="font-extrabold text-white/80">
                  base placement points
                </span>{" "}
                ×{" "}
                <span className="font-extrabold text-white/80">tier</span> ×{" "}
                <span className="font-extrabold text-white/80">
                  bracket-size bonus
                </span>
                . The bonus grows with the number of players, up to double for a
                full 32-player bracket — so a bigger, tougher field is worth more.
                The champion figures above assume an 8-player bracket.
              </p>
              <div className="mt-1 flex flex-col gap-1.5 text-[13px] font-semibold text-white/55">
                <span>
                  <span className="text-[#4FA3E0]">•</span> Win a Minor (8
                  players) → 100 × 1 × 1 ={" "}
                  <span className="font-extrabold text-white/80">100 pts</span>
                </span>
                <span>
                  <span className="text-[#8E7BFF]">•</span> Win a Major (16
                  players) → 100 × 2 × 1.4 ≈{" "}
                  <span className="font-extrabold text-white/80">283 pts</span>
                </span>
                <span>
                  <span className="text-[#FFB800]">•</span> Win a Championship
                  (32 players) → 100 × 3 × 2 ={" "}
                  <span className="font-extrabold text-white/80">600 pts</span>
                </span>
              </div>
            </div>
          </section>

          {/* FAQ + points */}
          <section className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-2xl font-extrabold text-white">
                FAQ
              </h2>
              <FaqAccordion />
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="font-display text-2xl font-extrabold text-white">
                Placement points
              </h2>
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-[#101114] px-6 py-5">
                {points.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-[11px]"
                  >
                    <span className="text-[13.5px] font-extrabold text-white/70">
                      {p.label}
                    </span>
                    <span
                      className="font-display text-base font-extrabold"
                      style={{ color: p.color }}
                    >
                      {p.pts}
                    </span>
                  </div>
                ))}
                <span className="pt-3 text-xs font-bold leading-[1.6] text-white/35">
                  Base points for each placement — then multiplied by the
                  tournament&apos;s tier and bracket size (see above). Totals
                  accumulate on the{" "}
                  <Link
                    href="/leaderboard"
                    className="text-[#FFB800] hover:text-[#FFDD66] hover:underline"
                  >
                    season leaderboard
                  </Link>{" "}
                  and reset every season.
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/[0.06] px-6 py-5">
                <span className="font-display text-base font-extrabold text-[#FFB800]">
                  Ready to compete?
                </span>
                <span className="text-[13px] font-semibold leading-[1.6] text-white/60">
                  Registration for this season&apos;s tournaments is open now.
                </span>
                <Link
                  href="/tournaments"
                  className="mt-1.5 rounded-[10px] bg-[#FFB800] p-3 text-center font-display text-[14.5px] font-extrabold text-[#0A0B0D] transition hover:brightness-110"
                >
                  Browse Tournaments
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
