import type { Metadata } from "next";
import Link from "next/link";

import { register } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign up",
};

const inputClass =
  "w-full rounded-md border-2 border-[#e8b84b] bg-[#1a1233] px-4 py-3.5 text-sm text-[#eaf0ff] outline-none placeholder:text-[#8a86b8] focus:shadow-[0_0_20px_rgba(232,184,75,.35)]";

const labelClass =
  "mb-2 block font-display text-[13px] font-bold tracking-[3px] text-[#e8b84b]";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col gap-5 bg-[#241743] p-4 font-body sm:p-6">
      {/* Marquee */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-[#9ae8f5]/80 bg-gradient-to-b from-[#8fe4f4] to-[#37d5f0] px-6 py-5 text-center shadow-[0_0_45px_rgba(55,213,240,.5)] sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.2)_0_2px,transparent_2px_40px)]"
        />
        <span className="relative font-arcade text-base tracking-wider text-white [text-shadow:0_0_16px_rgba(255,255,255,.9),3px_3px_0_rgba(12,90,110,.8)] sm:text-2xl">
          NEW PLAYER
        </span>
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

        <div className="relative mx-auto w-full max-w-[560px]">
          <p className="text-center font-arcade text-[10px] tracking-wide text-[#37d5f0] sm:text-sm">
            CREATE YOUR CHARACTER
          </p>
          <h1 className="mt-3 text-center font-arcade text-2xl text-[#a8e9f7] [text-shadow:4px_4px_0_#5a4fcf] sm:text-4xl">
            CREATE ACCOUNT
          </h1>

          <form action={register} className="mt-9 flex flex-col gap-5">
            <div>
              <label htmlFor="username" className={labelClass}>
                USERNAME
              </label>
              <input
                id="username"
                name="username"
                placeholder="username_gaming"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={labelClass}>
                  SANDI
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  ULANGI
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#8f86c2]">
              <input
                type="checkbox"
                name="agree"
                required
                className="h-[18px] w-[18px] cursor-pointer appearance-none rounded-[4px] border-2 border-[#37d5f0] bg-[#1a1233] checked:bg-[#37d5f0] checked:shadow-[inset_0_0_0_3px_#1a1233]"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="#"
                  className="font-semibold text-[#37d5f0] hover:underline"
                >
                  Terms
                </Link>{" "}
                &{" "}
                <Link
                  href="#"
                  className="font-semibold text-[#37d5f0] hover:underline"
                >
                  Privacy Policy  
                </Link>{" "}
                of MABAR SUPER LEAGUE
              </span>
            </label>

            <button
              type="submit"
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-[#b9eef8] bg-gradient-to-b from-[#8fe4f4] to-[#37d5f0] py-4 font-arcade text-base text-[#0c2a36] shadow-[8px_8px_0_#ff2d95] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0_#ff2d95] sm:text-lg"
            >
              CREATE <span aria-hidden>▶</span>
            </button>
          </form>

          <p className="mt-7 text-center text-[15px] text-[#8f86c2]">
            Already have an sccount?{" "}
            <Link
              href="/login"
              className="font-display font-bold text-[#e8b84b] hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
