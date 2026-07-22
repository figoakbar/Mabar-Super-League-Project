"use client";

import { useRef } from "react";

export type GameRecord = {
  name: string;
  sub: string;
  w: number;
  l: number;
  rate: number;
  accent: string;
};

export function RecordsSlider({ games }: { games: GameRecord[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) =>
    sliderRef.current?.scrollBy({ left: dir * 306, behavior: "smooth" });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
          Competition Records
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="size-[34px] cursor-pointer rounded-lg border border-white/[0.14] text-[15px] text-white transition-colors hover:bg-white/[0.08]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="size-[34px] cursor-pointer rounded-lg border border-white/[0.14] text-[15px] text-white transition-colors hover:bg-white/[0.08]"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="flex gap-3.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] pl-[calc(50vw-50%)] pr-6 sm:pr-10"
      >
        {games.map((g) => (
          <article
            key={g.name}
            className="relative flex-[0_0_292px] cursor-pointer overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#101114] transition hover:-translate-y-1 hover:border-white/25"
          >
            <div className="h-[3px]" style={{ background: g.accent }} />
            <div className="flex flex-col gap-3.5 px-5 pb-4 pt-[18px]">
              <div className="flex flex-col gap-px">
                <span className="font-display text-[21px] font-bold tracking-[0.5px] text-white">
                  {g.name}
                </span>
                <span className="text-[11.5px] font-bold uppercase tracking-[1px] text-white/40">
                  {g.sub}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-4xl font-bold leading-none text-white">
                  {g.w}–{g.l}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: g.accent }}
                >
                  {g.rate}% WR
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
