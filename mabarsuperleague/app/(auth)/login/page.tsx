import type { Metadata } from "next";
import Link from "next/link";

import { PasswordField } from "@/components/auth/password-field";
import { login } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Log in",
};

const pentagon =
  "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)" as const;
const star8 =
  "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)" as const;

function RatingPill({ rating }: { rating: string }) {
  return (
    <div className="absolute right-[18px] top-[18px] flex items-center gap-[5px] rounded-full bg-black/35 px-3 py-[5px] text-[13px] font-extrabold text-white">
      ★ {rating}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative h-screen min-h-[720px] overflow-hidden bg-[#0C0C10] font-nunito">
      {/* Grid latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,black_40%,transparent_100%)]"
      />

      {/* Ornamen mengambang */}
      <div
        aria-hidden
        className="absolute left-[8%] top-[34%] size-[22px] rotate-45 rounded-[5px] bg-[#8E7BFF] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:0.4s]"
      />
      <div
        aria-hidden
        className="absolute right-[9%] top-[26%] size-4 rotate-45 rounded-[4px] bg-[#4FC3F7] opacity-50 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.2s]"
      />
      <div
        aria-hidden
        className="absolute right-[16%] top-[48%] size-3 rounded-full bg-[#FF8A80] opacity-45 [animation:float_3.4s_ease-in-out_infinite] [animation-delay:2s]"
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
          Log In & Start Playing
        </h1>

        <p className="max-w-[430px] text-center text-[15px] leading-relaxed text-white/55">
          Log in to your account and continue your adventure. Your friends are
          already waiting below!
        </p>

        {/* Kartu login */}
        <form
          action={login}
          className="mt-2.5 flex w-full max-w-[380px] flex-col gap-3.5 rounded-3xl border border-white/[0.09] bg-[#15151b]/90 p-7 pb-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65"
            >
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@email.com"
              required
              className="w-full rounded-xl border border-white/[0.12] bg-[#101015] px-3.5 py-3 text-[14.5px] font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FFC833]/70"
            />
          </div>

          <PasswordField />

          <div className="mt-0.5 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold text-white/55">
              <input
                type="checkbox"
                name="remember"
                className="size-[15px] accent-[#FFB800]"
              />
              Remember me
            </label>
            <Link
              href="#"
              className="text-[13px] font-bold text-[#FFC833] hover:text-[#FFDD66] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-1.5 w-full cursor-pointer rounded-[14px] bg-[#FFB800] p-3.5 font-baloo text-[16.5px] font-extrabold text-[#1A1108] transition hover:-translate-y-px hover:brightness-110 active:translate-y-px"
          >
            Log In Now
          </button>

          <div className="text-center text-[13.5px] font-semibold text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#FFC833] hover:text-[#FFDD66] hover:underline"
            >
              Sign up free
            </Link>
          </div>
        </form>
      </div>

      {/* Kipas kartu karakter */}
      <div className="absolute bottom-[-130px] left-1/2 z-[5] h-[430px] w-[1240px] -translate-x-1/2 scale-[0.55] max-lg:origin-bottom sm:scale-75 lg:scale-100">
        {/* 1. Sepak Bola — ungu */}
        <div className="absolute bottom-0 left-0 z-[1] h-[360px] w-[300px] origin-bottom -rotate-[16deg] rounded-[26px] bg-gradient-to-br from-[#8E7BFF] to-[#5B3FD4] p-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-5">
          <RatingPill rating="4,5" />
          <div className="pr-[68px] font-baloo text-[26px] font-extrabold text-white">
            Football
          </div>
          <div className="text-[13px] font-bold text-white/65">
            Fantasy League
          </div>
          <div className="absolute bottom-[130px] left-1/2 -ml-[55px] h-40 w-[110px]">
            <div className="absolute bottom-0 left-1/2 -ml-[38px] h-3.5 w-[76px] rounded-full bg-black/35 [animation:shadow-squash_1.5s_ease-in-out_infinite]" />
            <div className="absolute bottom-3.5 left-2.5 size-[90px] [animation:big-bounce_1.5s_ease-in-out_infinite]">
              <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_32%_26%,#FFFFFF,#E8E4F0_75%)] [animation:spin-slow_3s_linear_infinite]">
                <span
                  className="absolute left-[34px] top-[34px] size-[22px] bg-[#2E2A45]"
                  style={{ clipPath: pentagon }}
                />
                <span
                  className="absolute -top-2 left-[38px] size-[18px] bg-[#2E2A45]"
                  style={{ clipPath: pentagon }}
                />
                <span
                  className="absolute -bottom-2 left-[38px] size-[18px] bg-[#2E2A45]"
                  style={{ clipPath: pentagon }}
                />
                <span
                  className="absolute -left-2 top-9 size-[18px] bg-[#2E2A45]"
                  style={{ clipPath: pentagon }}
                />
                <span
                  className="absolute -right-2 top-9 size-[18px] bg-[#2E2A45]"
                  style={{ clipPath: pentagon }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tenis — merah */}
        <div className="absolute bottom-11 left-[235px] z-[2] h-[370px] w-[300px] origin-bottom -rotate-[8deg] rounded-[26px] bg-gradient-to-br from-[#FF8A80] to-[#E5484D] p-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-5">
          <RatingPill rating="4,8" />
          <div className="font-baloo text-[26px] font-extrabold text-white">
            Tennis
          </div>
          <div className="text-[13px] font-bold text-white/65">
            Smash Court
          </div>
          <div className="absolute bottom-28 left-1/2 -ml-[75px] h-[140px] w-[150px] [animation:float_3.4s_ease-in-out_infinite] [animation-delay:1.3s]">
            <span className="absolute left-[18px] top-1.5 size-2.5 rounded-[2px] bg-[#FFF0B8] [animation:confetti_2.4s_ease-in-out_infinite]" />
            <span className="absolute left-[70px] top-0 size-2 rounded-full bg-[#9FE8FF] [animation:confetti_2.4s_ease-in-out_infinite] [animation-delay:0.5s]" />
            <span className="absolute right-3.5 top-2.5 size-2.5 rounded-[2px] bg-[#7EE8A2] [animation:confetti_2.4s_ease-in-out_infinite] [animation-delay:1s]" />
            <span
              className="absolute left-1/2 top-7 -ml-[9px] size-[18px] bg-[#FFF0B8] [animation:pulse-soft_1.4s_ease-in-out_infinite]"
              style={{ clipPath: star8 }}
            />
            <div className="absolute bottom-0 left-0 grid h-11 w-12 place-items-center rounded-t-lg bg-[#FFE3D0]">
              <span className="font-baloo text-[22px] font-extrabold text-[#B0442E]">
                2
              </span>
            </div>
            <div className="absolute bottom-0 left-[50px] grid h-[70px] w-[50px] place-items-center rounded-t-lg bg-[#FFF3E8]">
              <span className="font-baloo text-[28px] font-extrabold text-[#B0442E]">
                1
              </span>
            </div>
            <div className="absolute bottom-0 right-0 grid h-8 w-12 place-items-center rounded-t-lg bg-[#F2C9B4]">
              <span className="font-baloo text-lg font-extrabold text-[#B0442E]">
                3
              </span>
            </div>
          </div>
        </div>

        {/* 3. Juara — biru (tengah) */}
        <div className="absolute bottom-[84px] left-[470px] z-[3] h-[380px] w-[300px] origin-bottom rounded-[26px] bg-gradient-to-br from-[#7FE3FF] to-[#2BA3E8] p-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-translate-y-5">
          <RatingPill rating="4,7" />
          <div className="font-baloo text-[26px] font-extrabold text-white">
            Champion
          </div>
          <div className="text-[13px] font-bold text-white/65">
            This Season&apos;s Tournament
          </div>
          <div className="absolute bottom-[84px] left-1/2 -ml-[65px] h-[140px] w-[130px] [animation:float_3.4s_ease-in-out_infinite]">
            <span
              className="absolute left-1 top-0 size-3.5 bg-white [animation:pulse-soft_1.4s_ease-in-out_infinite]"
              style={{ clipPath: star8 }}
            />
            <span
              className="absolute right-0 top-[30px] size-2.5 bg-white [animation:pulse-soft_1.4s_ease-in-out_infinite] [animation-delay:0.6s]"
              style={{ clipPath: star8 }}
            />
            <span className="absolute left-2.5 top-[22px] h-[30px] w-6 rounded-full border-8 border-[#E8A020]" />
            <span className="absolute right-2.5 top-[22px] h-[30px] w-6 rounded-full border-8 border-[#E8A020]" />
            <div className="absolute left-1/2 top-3 -ml-9 grid h-[62px] w-[72px] place-items-center rounded-[10px_10px_44px_44px] bg-gradient-to-br from-[#FFE29A] to-[#F2A93B]">
              <span className="font-baloo text-[26px] font-extrabold text-[#B06A10]">
                1
              </span>
            </div>
            <span className="absolute left-1/2 top-[74px] -ml-[7px] h-5 w-3.5 bg-[#E8A020]" />
            <span className="absolute left-1/2 top-[92px] -ml-[22px] h-2.5 w-11 rounded-[4px] bg-[#F2A93B]" />
            <span className="absolute left-1/2 top-[102px] -ml-8 h-4 w-16 rounded-md bg-[#B06A10]" />
          </div>
        </div>

        {/* 4. Motorsport — hijau */}
        <div className="absolute bottom-11 right-[235px] z-[2] h-[370px] w-[300px] origin-bottom rotate-[8deg] rounded-[26px] bg-gradient-to-br from-[#7EE8A2] to-[#2FA96E] p-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-5">
          <RatingPill rating="4,2" />
          <div className="pr-[68px] font-baloo text-[26px] font-extrabold text-white">
            Motorsport
          </div>
          <div className="text-[13px] font-bold text-white/65">Grand Prix</div>
          <div className="absolute bottom-24 left-1/2 -ml-[60px] h-[170px] w-[120px]">
            <span className="absolute left-2.5 top-0 h-[26px] w-1 rounded-sm bg-white/60 [animation:speedline_1.1s_linear_infinite]" />
            <span className="absolute right-2.5 top-0 h-[34px] w-1 rounded-sm bg-white/50 [animation:speedline_1.1s_linear_infinite] [animation-delay:0.4s]" />
            <span className="absolute left-14 top-0 h-[22px] w-1 rounded-sm bg-white/40 [animation:speedline_1.1s_linear_infinite] [animation-delay:0.8s]" />
            <div className="absolute inset-0 [animation:sway_2.2s_ease-in-out_infinite]">
              <span className="absolute left-1/2 top-0 -ml-11 h-3.5 w-[88px] rounded-[5px] bg-[#1C1926]" />
              <span className="absolute left-1/2 top-3 -ml-2 h-[52px] w-4 rounded-[8px_8px_4px_4px] bg-gradient-to-b from-[#FF8A80] to-[#D93A3A]" />
              <span className="absolute left-1/2 top-[22px] -ml-[3px] h-[30px] w-1.5 rounded-[3px] bg-[#FFF0B8]" />
              <span className="absolute left-1.5 top-6 h-[34px] w-6 rounded-lg bg-[#1C1926]" />
              <span className="absolute right-1.5 top-6 h-[34px] w-6 rounded-lg bg-[#1C1926]" />
              <span className="absolute left-1/2 top-[60px] -ml-[30px] h-[62px] w-[60px] rounded-[14px_14px_10px_10px] bg-gradient-to-b from-[#E5484D] to-[#B92E33]" />
              <span className="absolute left-1/2 top-[66px] -ml-[11px] h-[30px] w-[22px] rounded-[11px] border-4 border-[#3A3344] bg-[#1C1926]" />
              <span className="absolute left-0 top-[120px] h-10 w-7 rounded-[9px] bg-[#1C1926]" />
              <span className="absolute right-0 top-[120px] h-10 w-7 rounded-[9px] bg-[#1C1926]" />
              <span className="absolute left-1/2 top-32 -ml-8 h-[30px] w-16 rounded-lg bg-gradient-to-b from-[#D93A3A] to-[#A32629]" />
              <span className="absolute left-1/2 top-[156px] -ml-11 h-3.5 w-[88px] rounded-[5px] bg-[#1C1926]" />
            </div>
          </div>
        </div>

        {/* 5. Gaming — oranye */}
        <div className="absolute bottom-0 right-0 z-[1] h-[360px] w-[300px] origin-bottom rotate-[16deg] rounded-[26px] bg-gradient-to-br from-[#FFC46B] to-[#F2803B] p-[22px] shadow-[0_24px_50px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-5">
          <RatingPill rating="3,9" />
          <div className="font-baloo text-[26px] font-extrabold text-white">
            Gaming
          </div>
          <div className="text-[13px] font-bold text-white/65">
            Arcade Mania
          </div>
          <div className="absolute bottom-40 left-1/2 -ml-[60px] h-[90px] w-[120px] [animation:wobble_2.6s_ease-in-out_infinite]">
            <span className="absolute left-0 top-3.5 h-[60px] w-[120px] rounded-[30px] bg-[#2E2A3E] shadow-[inset_0_-6px_0_rgba(0,0,0,0.25)]" />
            <span className="absolute left-3.5 top-1.5 size-[34px] rounded-full bg-[#2E2A3E]" />
            <span className="absolute right-3.5 top-1.5 size-[34px] rounded-full bg-[#2E2A3E]" />
            <span className="absolute left-[22px] top-[34px] h-[9px] w-[26px] rounded-[3px] bg-[#C6C2D6]" />
            <span className="absolute left-[31px] top-[25px] h-[26px] w-[9px] rounded-[3px] bg-[#C6C2D6]" />
            <span className="absolute right-[30px] top-6 size-2.5 rounded-full bg-[#FFF0B8]" />
            <span className="absolute right-[18px] top-[38px] size-2.5 rounded-full bg-[#7EE8A2]" />
            <span className="absolute right-[42px] top-[38px] size-2.5 rounded-full bg-[#9FE8FF]" />
            <span className="absolute right-[30px] top-[52px] size-2.5 rounded-full bg-[#FF8A80]" />
            <span className="absolute left-[52px] top-10 size-[7px] rounded-full bg-[#6B6580]" />
            <span className="absolute left-[62px] top-10 size-[7px] rounded-full bg-[#6B6580]" />
          </div>
        </div>
      </div>

      {/* Gradasi bawah */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-[90px] bg-gradient-to-b from-transparent to-[#060609]/90"
      />
    </main>
  );
}
