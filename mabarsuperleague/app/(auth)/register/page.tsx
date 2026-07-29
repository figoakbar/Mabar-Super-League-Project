import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0C0C10] pb-16 font-nunito">
      {/* Latar tetap gelap walau halaman di-scroll melewati batas */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0C0C10]" />

      {/* Grid latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_90%_60%_at_50%_20%,black_40%,transparent_100%)]"
      />

      {/* Ornamen mengambang */}
      <div
        aria-hidden
        className="absolute left-[8%] top-[30%] size-[22px] rotate-45 rounded-[5px] bg-[#8E7BFF] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:0.4s]"
      />
      <div
        aria-hidden
        className="absolute right-[9%] top-[22%] size-4 rotate-45 rounded-[4px] bg-[#4FC3F7] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.2s]"
      />
      <div
        aria-hidden
        className="absolute right-[14%] top-[52%] size-3 rounded-full bg-[#FF8A80] opacity-45 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:2s]"
      />

      {/* Bar atas */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-[22px] sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-[#FFC24B] to-[#F2803B]">
            <span className="size-3 rounded-[4px] bg-[#1A1108]" />
          </span>
          <span className="font-baloo text-[19px] font-extrabold tracking-[0.3px] text-white">
            Mabar Super League
          </span>
        </Link>
        <Link
          href="#"
          className="text-sm font-bold text-white/55 hover:text-white/80"
        >
          Need help?
        </Link>
      </div>

      {/* Konten utama */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pt-[86px]">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-[7px] text-[13px]">
          <span className="font-extrabold text-[#FFB800]">★</span>
          <span className="font-extrabold text-white">New Season</span>
          <span className="font-semibold text-white/45">— Free Access</span>
        </div>

        <h1 className="text-center font-baloo text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl">
          Create Your Player Account
        </h1>

        <p className="max-w-[430px] text-center text-[15px] leading-relaxed text-white/55">
          Tell us how you play so we can put you in the right bracket. It takes
          less than a minute.
        </p>

        <RegisterForm />
      </div>
    </main>
  );
}
