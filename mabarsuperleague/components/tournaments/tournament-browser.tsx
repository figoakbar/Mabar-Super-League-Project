"use client";

import { useState } from "react";

export type OpenTournament = {
  id: string;
  cat: string;
  gameLabel: string;
  name: string;
  format: string;
  accent: string;
  prize: string;
  fee: string;
  regEnds: string;
  filled: number;
  slots: number;
};

const cats = ["All", "Football", "Racing", "Tennis", "Arcade"];

export function TournamentBrowser({ data }: { data: OpenTournament[] }) {
  const [filter, setFilter] = useState("All");
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  const shown =
    filter === "All" ? data : data.filter((t) => t.cat === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[26px] font-extrabold text-white">
            Open Tournaments
          </h2>
          <span className="text-[13.5px] font-semibold text-white/45">
            Register now — slots are limited per bracket.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-[12.5px] font-extrabold transition-colors ${
                  active
                    ? "border-[#FFB800] bg-[#FFB800] text-[#0A0B0D]"
                    : "border-white/[0.14] bg-transparent text-white/55 hover:text-white"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => {
          const isFull = t.filled >= t.slots;
          const reg = !!registered[t.id];
          const pct = Math.round((t.filled / t.slots) * 100);

          return (
            <article
              key={t.id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114] transition hover:-translate-y-1 hover:border-white/25"
            >
              <div className="h-[3px]" style={{ background: t.accent }} />

              <div className="flex items-center justify-between gap-2.5 px-[22px] pt-5">
                <span
                  className="text-[10.5px] font-extrabold tracking-[1.5px]"
                  style={{ color: t.accent }}
                >
                  {t.gameLabel}
                </span>
                <div
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{
                    background: isFull
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(111,207,151,0.12)",
                  }}
                >
                  <span
                    className="size-1.5 rounded-full [animation:pulse-soft_1.4s_ease-in-out_infinite]"
                    style={{
                      background: isFull ? "rgba(255,255,255,0.4)" : "#6FCF97",
                    }}
                  />
                  <span
                    className="text-[10.5px] font-extrabold tracking-[0.5px]"
                    style={{
                      color: isFull ? "rgba(255,255,255,0.4)" : "#6FCF97",
                    }}
                  >
                    {isFull ? "FULL" : "OPEN"}
                  </span>
                </div>
              </div>

              <div className="px-[22px] pt-2">
                <h3 className="font-display text-[19px] font-bold leading-[1.25] text-white">
                  {t.name}
                </h3>
                <p className="mt-[3px] text-[12.5px] font-semibold text-white/45">
                  {t.format}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 px-[22px] py-4">
                <div className="flex flex-col gap-px">
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                    REGISTRATION ENDS
                  </span>
                  <span className="font-display text-base font-bold text-white">
                    {t.regEnds}
                  </span>
                </div>
                <div className="flex flex-col gap-px">
                  <span className="text-[10.5px] font-extrabold tracking-[1px] text-white/35">
                    ENTRY FEE
                  </span>
                  <span className="font-display text-base font-bold text-[#FFB800]">
                    {t.fee}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 px-[22px] pb-[18px]">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11.5px] font-bold text-white/45">
                    <span>
                      {t.filled} / {t.slots} slots filled
                    </span>
                    <span style={{ color: t.accent }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: t.accent }}
                    />
                  </div>
                </div>

                {isFull ? (
                  <div className="w-full rounded-[10px] border border-white/[0.08] bg-white/5 p-3 text-center font-display text-[14.5px] font-bold text-white/35">
                    Bracket Full
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setRegistered((s) => ({ ...s, [t.id]: !s[t.id] }))
                    }
                    className="w-full cursor-pointer rounded-[10px] p-3 font-display text-[14.5px] font-extrabold transition hover:brightness-110"
                    style={{
                      background: reg ? "rgba(111,207,151,0.15)" : "#FFB800",
                      color: reg ? "#6FCF97" : "#0A0B0D",
                    }}
                  >
                    {reg ? "Registered ✓" : "Register Now"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
