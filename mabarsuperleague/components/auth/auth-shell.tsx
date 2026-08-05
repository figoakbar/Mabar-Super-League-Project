import type { ReactNode } from "react";
import Link from "next/link";

/** Shared chrome for the standalone auth pages (forgot / reset password). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0C0C10] font-nunito">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,black_40%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute left-[10%] top-[28%] size-[22px] rotate-45 rounded-[5px] bg-[#8E7BFF] opacity-40 [animation:float_3.4s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="absolute right-[12%] top-[34%] size-4 rotate-45 rounded-[4px] bg-[#4FC3F7] opacity-40 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.2s]"
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-[22px] sm:px-10">
        <Link href="/login" className="flex items-center gap-2.5">
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-[#FFC24B] to-[#F2803B]">
            <span className="size-3 rounded-[4px] bg-[#1A1108]" />
          </span>
          <span className="font-baloo text-[19px] font-extrabold tracking-[0.3px] text-white">
            Mabar Super League
          </span>
        </Link>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-24">
        <h1 className="text-center font-baloo text-[34px] font-extrabold leading-[1.15] text-white sm:text-[42px]">
          {title}
        </h1>
        <p className="max-w-[420px] text-center text-[15px] leading-relaxed text-white/55">
          {subtitle}
        </p>
        {children}
      </div>
    </main>
  );
}
