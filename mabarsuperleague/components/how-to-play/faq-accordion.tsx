"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How long does payment verification take?",
    a: "Admins verify receipts within 1×24 hours. You get a confirmation on your dashboard and Discord once your slot is locked in. If your payment is rejected, the fee is fully refunded.",
  },
  {
    q: "What happens if my opponent doesn't show up?",
    a: "Wait 15 minutes past the scheduled time, take a screenshot of the lobby, and report it in the results channel. The match is awarded to you as a walkover win.",
  },
  {
    q: "Can I play on any platform?",
    a: "Each game lists its supported platforms in the catalog. Cross-play tournaments allow any listed platform; platform-specific brackets are labeled on the tournament card.",
  },
  {
    q: "Is there a refund if I withdraw?",
    a: "Entry fees are refundable only if the tournament is cancelled by the organizer, or your payment fails verification. Voluntary withdrawal after confirmation is not refunded.",
  },
  {
    q: "How do I report my match result?",
    a: "Upload a screenshot of the final score screen in the tournament's results channel on Discord within 15 minutes of finishing. Both players confirm, then the bracket updates automatically.",
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
