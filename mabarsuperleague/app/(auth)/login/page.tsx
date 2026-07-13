import type { Metadata } from "next";
import Link from "next/link";

import { login } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col gap-5 bg-[#241743] p-4 font-body sm:p-6">
      {/* Marquee */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-[#ff5cb0]/70 bg-[#ff2d95] px-6 py-5 text-center shadow-[0_0_45px_rgba(255,45,149,.55)] sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.16)_0_2px,transparent_2px_40px)]"
        />
        <Link
          href="/"
          className="relative font-arcade text-base tracking-wider text-white [text-shadow:0_0_16px_rgba(255,255,255,.9),3px_3px_0_rgba(150,10,85,.9)] sm:text-2xl"
        >
          MABAR SUPER LEAGUE
        </Link>
      </header>

      {/* CRT screen */}
      <section className="relative flex-1 overflow-hidden rounded-2xl border-2 border-[#4a3a6e] bg-[#12091e] px-5 py-8 shadow-[0_0_50px_rgba(59,26,110,.35)] sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.4)_0_2px,transparent_2px_4px)] opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,32,120,.25)_0%,transparent_70%)]"
        />

        {/* HUD row */}
        <div className="relative flex items-center justify-between font-arcade text-[10px] tracking-wide sm:text-xs">
          <span className="text-[#e8b84b]">CREDIT 01</span>
          <span className="text-[#37d5f0]">PLAYER LOGIN</span>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-[560px] sm:mt-12">
          <p className="animate-[arcade-blink_1.2s_step-end_infinite] text-center font-arcade text-[10px] tracking-wide text-[#c2589a] sm:text-sm">
            INSERT ACCOUNT TO CONTINUE
          </p>
          <h1 className="mt-4 text-center font-arcade text-2xl text-[#ffd9ef] [text-shadow:4px_4px_0_#ff2d95] sm:text-4xl">
            ENTER ARENA
          </h1>

          <form action={login} className="mt-10 flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-display text-[13px] font-bold tracking-[3px] text-[#37d5f0]"
              >
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="w-full rounded-md border-2 border-[#37d5f0] bg-[#151233] px-4 py-3.5 text-sm text-[#eaf0ff] outline-none placeholder:text-[#8a86b8] focus:shadow-[0_0_20px_rgba(55,213,240,.4)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-display text-[13px] font-bold tracking-[3px] text-[#37d5f0]"
              >
                CODE
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full rounded-md border-2 border-[#37d5f0] bg-[#151233] px-4 py-3.5 text-sm text-[#eaf0ff] outline-none placeholder:text-[#8a86b8] focus:shadow-[0_0_20px_rgba(55,213,240,.4)]"
              />
            </div>

            <Link
              href="#"
              className="self-end font-display text-sm font-semibold text-[#37d5f0] hover:underline"
            >
              Forgot Password?
            </Link>

            <button
              type="submit"
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-[#f7d98a] bg-[#e8b84b] py-4 font-arcade text-base text-[#2a1a08] shadow-[8px_8px_0_#ff2d95] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0_#ff2d95] sm:text-lg"
            >
              START <span aria-hidden>▶</span>
            </button>
          </form>

          <p className="mt-8 text-center text-[15px] text-[#8f86c2]">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-display font-bold text-[#37d5f0] hover:underline"
            >
              Sign up now
            </Link>
          </p>

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              className="cursor-pointer rounded-md border-2 border-[#e8b84b] bg-transparent px-7 py-2.5 font-display text-sm font-semibold text-[#e8b84b] transition-colors hover:bg-[#e8b84b]/10"
            >
              Google
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md border-2 border-[#ff2d95] bg-transparent px-7 py-2.5 font-display text-sm font-semibold text-[#ff5cb0] transition-colors hover:bg-[#ff2d95]/10"
            >
              Discord
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
