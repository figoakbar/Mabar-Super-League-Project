"use client";

import { X } from "lucide-react";

export const btn = {
  primary:
    "cursor-pointer rounded-lg bg-[#FFB800] px-4 py-2 font-display text-sm font-extrabold text-[#0A0B0D] transition hover:brightness-110 disabled:opacity-50",
  ghost:
    "cursor-pointer rounded-lg border border-white/[0.14] bg-transparent px-4 py-2 font-display text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50",
  danger:
    "cursor-pointer rounded-lg border border-[#E07A72]/40 bg-[#E07A72]/10 px-3 py-1.5 text-xs font-extrabold text-[#E07A72] transition-colors hover:bg-[#E07A72]/20",
  chip: "cursor-pointer rounded-md border border-white/[0.14] px-2.5 py-1 text-xs font-bold text-white/60 transition-colors hover:text-white",
};

const inputCls =
  "w-full rounded-lg border border-white/[0.12] bg-[#0A0B0D] px-3.5 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFB800]/60";

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
        {label}
      </span>
      <input className={inputCls} {...props} />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
        {label}
      </span>
      <textarea className={`${inputCls} min-h-[80px] resize-y`} {...props} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold tracking-[1px] text-white/45">
        {label}
      </span>
      <select className={inputCls} {...props}>
        {children}
      </select>
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ["rgba(79,163,224,0.14)", "#4FA3E0"],
    closed: ["rgba(217,142,82,0.14)", "#D98E52"],
    ongoing: ["rgba(255,184,0,0.14)", "#FFB800"],
    completed: ["rgba(111,207,151,0.14)", "#6FCF97"],
    pending: ["rgba(255,184,0,0.14)", "#FFB800"],
    confirmed: ["rgba(111,207,151,0.14)", "#6FCF97"],
    rejected: ["rgba(224,122,114,0.14)", "#E07A72"],
    scheduled: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.6)"],
  };
  const [bg, color] = map[status] ?? ["rgba(255,255,255,0.08)", "#FFF"];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#101114] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-extrabold text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-[#E07A72]/30 bg-[#E07A72]/10 px-4 py-2.5 text-sm font-semibold text-[#E07A72]">
      {message}
    </div>
  );
}
