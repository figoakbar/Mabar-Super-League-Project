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
    text: "Sign up free with your email, choose a username, and complete your player profile.",
  },
  {
    n: "02",
    icon: "pick",
    accent: "#8E7BFF",
    accentBorder: "rgba(142,123,255,0.45)",
    iconBg: "rgba(142,123,255,0.1)",
    delay: "0.4s",
    title: "Pick a tournament",
    text: "Browse open tournaments, check the format, schedule, and entry fee, then hit register before slots run out.",
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
    title: "Join the Discord & check in",
    text: "All match coordination happens on the official Discord. Check in 30 minutes before every scheduled match — missing check-in counts as a forfeit.",
    dotBg: "rgba(255,184,0,0.12)",
    dotBorder: "rgba(255,184,0,0.4)",
    dotColor: "#FFB800",
  },
  {
    n: "2",
    title: "Play your group stage matches",
    text: "Follow your matchday schedule on the tournament page. Wins earn 3 points; the top 2 of each group advance to the knockout stage.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "3",
    title: "Report every result",
    text: "Screenshot the final score screen and post it in the results channel within 15 minutes. Brackets and standings update automatically once both players confirm.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "4",
    title: "Survive the knockout stage",
    text: "Single elimination from quarterfinals onward — lose and you're out. Finals are best of 3, streamed live on the MSL channel.",
    dotBg: "rgba(255,255,255,0.05)",
    dotBorder: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.6)",
  },
  {
    n: "5",
    title: "Win prizes & climb the leaderboard",
    text: "Champions take the prize pool and a profile badge. Every match also earns season points toward the global leaderboard.",
    dotBg: "rgba(111,207,151,0.12)",
    dotBorder: "rgba(111,207,151,0.4)",
    dotColor: "#6FCF97",
  },
];

const points = [
  { label: "Champion", pts: "+500", color: "#FFB800" },
  { label: "Runner-up", pts: "+300", color: "#C7CEDC" },
  { label: "Semifinalist", pts: "+180", color: "#D98E52" },
  { label: "Quarterfinalist", pts: "+100", color: "rgba(255,255,255,0.7)" },
  { label: "Group stage win", pts: "+25", color: "rgba(255,255,255,0.7)" },
  { label: "Match played", pts: "+10", color: "rgba(255,255,255,0.7)" },
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
              need to join your first MSL tournament.
            </p>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-6 pb-20 pt-11 sm:px-10">
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
                Season points
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
                <span className="pt-3 text-xs font-bold text-white/35">
                  Points accumulate on the{" "}
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
                  Registration for Season 5 tournaments is open now.
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
