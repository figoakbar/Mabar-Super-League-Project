"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";

import { GoogleButton } from "@/components/auth/google-button";
import { authInputClass, PasswordField } from "@/components/auth/password-field";
import {
  CONSOLE_PLATFORMS,
  combineIds,
  deviceComplete,
  PC_PLATFORMS,
  PlatformPicker,
} from "@/components/shared/gamer-platforms";
import { register, type AuthState } from "@/lib/auth/actions";

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65"
    >
      {children}
    </label>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    register,
    {},
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [onConsole, setOnConsole] = useState(false);
  const [onPc, setOnPc] = useState(false);
  // Keyed by platform; a key present means "picked", its value is the gamer id.
  const [consolePicks, setConsolePicks] = useState<Record<string, string>>({});
  const [pcPicks, setPcPicks] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // React clears the form's DOM once a server action finishes, which unticks
  // every checkbox on screen while our state still says they are ticked —
  // leaving Create Account live over a consent box the user can see is empty.
  // Follow the form's own reset so the two can never disagree.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onReset = () => {
      setAgreed(false);
      setOnConsole(false);
      setOnPc(false);
      setConsolePicks({});
      setPcPicks({});
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const togglePick =
    (setter: Dispatch<SetStateAction<Record<string, string>>>) =>
    (key: string) =>
      setter((prev) => {
        const next = { ...prev };
        if (key in next) delete next[key];
        else next[key] = "";
        return next;
      });
  const setPickId =
    (setter: Dispatch<SetStateAction<Record<string, string>>>) =>
    (key: string, value: string) =>
      setter((prev) => ({ ...prev, [key]: value }));

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const noDevice = !onConsole && !onPc;
  const consoleComplete = deviceComplete(onConsole, CONSOLE_PLATFORMS, consolePicks);
  const pcComplete = deviceComplete(onPc, PC_PLATFORMS, pcPicks);
  const consoleId = onConsole ? combineIds(CONSOLE_PLATFORMS, consolePicks) : "";
  const pcId = onPc ? combineIds(PC_PLATFORMS, pcPicks) : "";
  const canSubmit =
    password.length >= 8 &&
    !mismatch &&
    !noDevice &&
    consoleComplete &&
    pcComplete &&
    agreed;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-2.5 flex w-full max-w-[520px] flex-col gap-3.5 rounded-3xl border border-white/[0.09] bg-[#15151b]/90 p-7 pb-6 shadow-[0_30px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          {state.error}
        </p>
      )}

      {/* Account */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">USERNAME</Label>
          <input
            id="username"
            name="username"
            placeholder="your_gamertag"
            required
            className={authInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">EMAIL</Label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            required
            className={authInputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">PHONE NUMBER</Label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="08xx xxxx xxxx"
          required
          className={authInputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <PasswordField
          value={password}
          onChange={setPassword}
          invalid={tooShort}
          hint="At least 8 characters."
        />
        <PasswordField
          name="confirmPassword"
          label="CONFIRM PASSWORD"
          value={confirm}
          onChange={setConfirm}
          invalid={mismatch}
        />
      </div>
      {mismatch && (
        <p className="-mt-1 text-xs font-bold text-[#FF8A80]">
          Passwords don&apos;t match.
        </p>
      )}
      {state.fieldErrors?.password && (
        <p className="-mt-1 text-xs font-bold text-[#FF8A80]">
          {state.fieldErrors.password}
        </p>
      )}

      {/* Devices */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
        <span className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65">
          WHAT DO YOU PLAY ON?
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold text-white/70">
            <input
              type="checkbox"
              checked={onConsole}
              onChange={(e) => setOnConsole(e.target.checked)}
              className="size-[15px] accent-[#FFB800]"
            />
            Console
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold text-white/70">
            <input
              type="checkbox"
              checked={onPc}
              onChange={(e) => setOnPc(e.target.checked)}
              className="size-[15px] accent-[#FFB800]"
            />
            PC
          </label>
        </div>

        {noDevice && (
          <p className="text-xs font-bold text-white/35">
            Pick at least one — we use it to seed you into the right bracket.
          </p>
        )}

        {onConsole && (
          <PlatformPicker
            legend="CONSOLE — PICK PLAYSTATION AND/OR XBOX"
            platforms={CONSOLE_PLATFORMS}
            picks={consolePicks}
            onToggle={togglePick(setConsolePicks)}
            onId={setPickId(setConsolePicks)}
            inputClass={authInputClass}
          />
        )}
        {onConsole && !consoleComplete && (
          <p className="text-xs font-bold text-white/35">
            Pick a console platform and fill in its ID.
          </p>
        )}

        {onPc && (
          <PlatformPicker
            legend="PC — PICK STEAM, EPIC AND/OR RIOT"
            platforms={PC_PLATFORMS}
            picks={pcPicks}
            onToggle={togglePick(setPcPicks)}
            onId={setPickId(setPcPicks)}
            inputClass={authInputClass}
          />
        )}
        {onPc && !pcComplete && (
          <p className="text-xs font-bold text-white/35">
            Pick a PC platform and fill in its ID.
          </p>
        )}
      </div>

      {/* Combined values submitted to the register action. */}
      <input type="hidden" name="consoleId" value={consoleId} />
      <input type="hidden" name="pcId" value={pcId} />

      {/* Optional */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagram">
          INSTAGRAM (OPTIONAL)
        </Label>
        <input
          id="instagram"
          name="instagram"
          placeholder="@yourhandle"
          className={authInputClass}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] font-semibold leading-relaxed text-white/55">
        <input
          type="checkbox"
          name="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-[15px] shrink-0 accent-[#FFB800]"
        />
        <span>
          I agree to the{" "}
          <a
            href="/docs/terms.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#FFC833] hover:underline"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/docs/privacy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#FFC833] hover:underline"
          >
            Privacy Policy
          </a>{" "}
          of Indonesia Arcadia Gaming League.
        </span>
      </label>
      {state.fieldErrors?.agree && (
        <p className="-mt-1 text-xs font-bold text-[#FF8A80]">
          {state.fieldErrors.agree}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="mt-1.5 w-full rounded-[14px] p-3.5 font-baloo text-[16.5px] font-extrabold transition enabled:cursor-pointer enabled:hover:-translate-y-px enabled:hover:brightness-110 enabled:active:translate-y-px"
        style={{
          background: canSubmit ? "#FFB800" : "rgba(255,255,255,0.06)",
          color: canSubmit ? "#1A1108" : "rgba(255,255,255,0.3)",
        }}
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.1]" />
        <span className="text-[11.5px] font-bold tracking-[0.5px] text-white/30">
          OR
        </span>
        <span className="h-px flex-1 bg-white/[0.1]" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <div className="text-center text-[13.5px] font-semibold text-white/50">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#FFC833] hover:text-[#FFDD66] hover:underline"
        >
          Log in
        </Link>
      </div>
    </form>
  );
}
