"use client";

import { useState } from "react";

export type TournamentEntry = {
  tag: string;
  accent: string;
  gameLabel: string;
  name: string;
  status: string;
  statusBg: string;
  statusColor: string;
  stage?: string;
  recordVal?: string;
  recordRest?: string;
  note?: string;
};

function TournamentCard({ t }: { t: TournamentEntry }) {
  return (
    <article className="overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#101114] transition-colors hover:border-white/[0.22]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3.5">
          <div
            className="grid size-11 place-items-center rounded-lg border bg-white/[0.04]"
            style={{ borderColor: t.accent }}
          >
            <span
              className="font-display text-[15px] font-bold"
              style={{ color: t.accent }}
            >
              {t.tag}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[10.5px] font-extrabold tracking-[1.5px]"
              style={{ color: t.accent }}
            >
              {t.gameLabel}
            </span>
            <span className="text-[15.5px] font-extrabold text-white">
              {t.name}
            </span>
          </div>
        </div>
        <div
          className="whitespace-nowrap rounded-[5px] px-3 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.8px]"
          style={{ background: t.statusBg, color: t.statusColor }}
        >
          {t.status}
        </div>
      </div>

      {t.stage ? (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-black/35 px-5 py-[11px]">
          <span className="text-[11px] font-extrabold tracking-[1.2px] text-white/45">
            {t.stage}
          </span>
          <span className="whitespace-nowrap text-[12.5px] font-bold text-white/55">
            Record{" "}
            <span className="font-extrabold" style={{ color: t.accent }}>
              {t.recordVal}
            </span>{" "}
            · {t.recordRest}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 border-t border-white/[0.06] bg-black/35 px-5 py-[11px]">
          <span className="size-[7px] rounded-full bg-[#FFB800] [animation:pulse-soft_1.4s_ease-in-out_infinite]" />
          <span className="text-[12.5px] font-semibold text-white/55">
            {t.note}
          </span>
        </div>
      )}
    </article>
  );
}

export function TournamentTabs({
  ongoing,
  past,
}: {
  ongoing: TournamentEntry[];
  past: TournamentEntry[];
}) {
  const [tab, setTab] = useState<"ongoing" | "past">("ongoing");
  const list = tab === "ongoing" ? ongoing : past;

  const tabClass = (active: boolean) =>
    `cursor-pointer rounded-[5px] px-4 py-1.5 text-xs font-extrabold tracking-[0.5px] transition-colors ${
      active ? "bg-[#FFB800] text-[#0A0B0D]" : "bg-transparent text-white/50"
    }`;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-[1.5px] text-white">
          My Tournaments
        </h2>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-[#101114] p-1">
          <button
            type="button"
            onClick={() => setTab("ongoing")}
            className={tabClass(tab === "ongoing")}
          >
            ONGOING
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={tabClass(tab === "past")}
          >
            PAST
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {list.map((t) => (
          <TournamentCard key={t.name} t={t} />
        ))}
      </div>
    </section>
  );
}
