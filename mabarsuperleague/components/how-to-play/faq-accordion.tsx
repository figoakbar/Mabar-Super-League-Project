"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How long does payment verification take?",
    a: "Admins verify receipts within 1×24 hours. Your dashboard shows the status, and your slot is locked once it's confirmed. If your payment is rejected, the fee is fully refunded.",
  },
  {
    q: "How are match scores recorded?",
    a: "Admins record every result in the tournament's Matches & Scores — you don't self-report. The bracket, standings and your player record update automatically after each match.",
  },
  {
    q: "Can I play on any platform?",
    a: "Each tournament lists the platforms it supports (PS5, Xbox, PC, and so on) on its card and detail page. Add your gamer IDs (PSN, Xbox, Steam, Epic or Riot) to your profile so you're ready to be matched.",
  },
  {
    q: "How do season points and tiers work?",
    a: "You earn season points by how far you place — champion, runner-up, semifinalist and so on. Those base points are multiplied by the tournament's tier (Minor ×1, Major ×2, Championship ×3) and its bracket size. Exhibition tournaments award no points, and every player's total resets at the start of each season.",
  },
  {
    q: "Is there a refund if I withdraw?",
    a: "Entry fees are refundable only if the tournament is cancelled by the organizer, or your payment fails verification. Voluntary withdrawal after confirmation is not refunded.",
  },
  {
    q: "What happens if my opponent doesn't show up?",
    a: "Contact the admins if your opponent is a no-show at the scheduled time. They review it and can award the match to you as a walkover.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-2.5">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#101114]"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-[14.5px] font-extrabold text-white">
                {f.q}
              </span>
              <span className="shrink-0 font-display text-lg font-extrabold text-[#FFB800]">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-[13.5px] font-semibold leading-[1.7] text-white/55">
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
