"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { authCardClass, authInputClass } from "@/components/auth/styles";
import {
  CONSOLE_PLATFORMS,
  combineIds,
  deviceComplete,
  parseIds,
  PC_PLATFORMS,
  PlatformPicker,
} from "@/components/shared/gamer-platforms";
import { completeProfile, logout, type AuthState } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/dal";

const SEPARATOR = " · ";

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

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="-mt-1 text-xs font-bold text-[#FF8A80]">{children}</p>;
}

/**
 * The mandatory first-sign-in step. Everything a player may already have on
 * file is prefilled — an account from the password era arrives here with its
 * username, phone and gamer IDs intact — so for them this is one confirm.
 */
export function CompleteProfileForm({
  user,
  next,
}: {
  user: SessionUser;
  next: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    completeProfile,
    {},
  );

  const [username, setUsername] = useState(user.username);
  const [phone, setPhone] = useState(user.phone);
  const [instagram, setInstagram] = useState(user.instagram);

  // Gamer IDs, split back into per-platform picks plus any free-text value
  // saved before the pickers existed, so nothing already on file is dropped.
  const parsedConsole = parseIds(CONSOLE_PLATFORMS, user.consoleId);
  const parsedPc = parseIds(PC_PLATFORMS, user.pcId);
  const [onConsole, setOnConsole] = useState(
    Object.keys(parsedConsole.picks).length > 0 || parsedConsole.leftover !== "",
  );
  const [onPc, setOnPc] = useState(
    Object.keys(parsedPc.picks).length > 0 || parsedPc.leftover !== "",
  );
  const [consolePicks, setConsolePicks] = useState<Record<string, string>>(
    parsedConsole.picks,
  );
  const [pcPicks, setPcPicks] = useState<Record<string, string>>(parsedPc.picks);
  const [otherConsole, setOtherConsole] = useState(parsedConsole.leftover);
  const [otherPc, setOtherPc] = useState(parsedPc.leftover);
  const [agreed, setAgreed] = useState(false);

  // React clears the form's DOM once a server action finishes. Text fields are
  // controlled and come back on their own; checkboxes do not, so remount them
  // on the form's own reset event to keep what is shown in step with state.
  const formRef = useRef<HTMLFormElement>(null);
  const [formNonce, setFormNonce] = useState(0);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onReset = () => setFormNonce((n) => n + 1);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const togglePick =
    (setter: Dispatch<SetStateAction<Record<string, string>>>) =>
    (key: string) =>
      setter((prev) => {
        const nextPicks = { ...prev };
        if (key in nextPicks) delete nextPicks[key];
        else nextPicks[key] = "";
        return nextPicks;
      });
  const setPickId =
    (setter: Dispatch<SetStateAction<Record<string, string>>>) =>
    (key: string, value: string) =>
      setter((prev) => ({ ...prev, [key]: value }));

  const consoleComplete = deviceComplete(onConsole, CONSOLE_PLATFORMS, consolePicks);
  const pcComplete = deviceComplete(onPc, PC_PLATFORMS, pcPicks);
  const consoleId = onConsole
    ? [combineIds(CONSOLE_PLATFORMS, consolePicks), otherConsole.trim()]
        .filter(Boolean)
        .join(SEPARATOR)
    : "";
  const pcId = onPc
    ? [combineIds(PC_PLATFORMS, pcPicks), otherPc.trim()]
        .filter(Boolean)
        .join(SEPARATOR)
    : "";
  const noDevice = !consoleId && !pcId;

  const canSubmit =
    username.trim().length >= 3 &&
    phone.trim().length > 0 &&
    !noDevice &&
    (consoleComplete || otherConsole.trim() !== "") &&
    (pcComplete || otherPc.trim() !== "") &&
    agreed;

  const fe = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${authCardClass} max-w-[520px]`}
    >
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="consoleId" value={consoleId} />
      <input type="hidden" name="pcId" value={pcId} />

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 px-3.5 py-2.5 text-[13px] font-bold text-[#FF8A80]"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">SIGNED IN AS</Label>
        <input
          id="email"
          value={user.email}
          readOnly
          className={`${authInputClass} cursor-default text-white/55`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">USERNAME</Label>
          <input
            id="username"
            name="username"
            placeholder="your_gamertag"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={authInputClass}
          />
          <FieldError>{fe.username}</FieldError>
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={authInputClass}
          />
          <FieldError>{fe.phone}</FieldError>
        </div>
      </div>

      {/* Devices */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
        <span className="text-[12.5px] font-extrabold tracking-[0.4px] text-white/65">
          WHAT DO YOU PLAY ON?
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold text-white/70">
            <input
              key={`console-${formNonce}`}
              type="checkbox"
              checked={onConsole}
              onChange={(e) => setOnConsole(e.target.checked)}
              className="size-[15px] accent-[#FFB800]"
            />
            Console
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-bold text-white/70">
            <input
              key={`pc-${formNonce}`}
              type="checkbox"
              checked={onPc}
              onChange={(e) => setOnPc(e.target.checked)}
              className="size-[15px] accent-[#FFB800]"
            />
            PC
          </label>
        </div>

        {!onConsole && !onPc && (
          <p className="text-xs font-bold text-white/35">
            Pick at least one — opponents use it to find you.
          </p>
        )}

        {onConsole && (
          <>
            <PlatformPicker
              legend="CONSOLE — PICK PLAYSTATION AND/OR XBOX"
              platforms={CONSOLE_PLATFORMS}
              picks={consolePicks}
              onToggle={togglePick(setConsolePicks)}
              onId={setPickId(setConsolePicks)}
              inputClass={authInputClass}
            />
            {parsedConsole.leftover !== "" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otherConsole">OTHER CONSOLE ID</Label>
                <input
                  id="otherConsole"
                  value={otherConsole}
                  onChange={(e) => setOtherConsole(e.target.value)}
                  className={authInputClass}
                />
              </div>
            )}
            {!consoleComplete && otherConsole.trim() === "" && (
              <p className="text-xs font-bold text-white/35">
                Pick a console platform and fill in its ID.
              </p>
            )}
          </>
        )}

        {onPc && (
          <>
            <PlatformPicker
              legend="PC — PICK STEAM, EPIC AND/OR RIOT"
              platforms={PC_PLATFORMS}
              picks={pcPicks}
              onToggle={togglePick(setPcPicks)}
              onId={setPickId(setPcPicks)}
              inputClass={authInputClass}
            />
            {parsedPc.leftover !== "" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otherPc">OTHER PC ID</Label>
                <input
                  id="otherPc"
                  value={otherPc}
                  onChange={(e) => setOtherPc(e.target.value)}
                  className={authInputClass}
                />
              </div>
            )}
            {!pcComplete && otherPc.trim() === "" && (
              <p className="text-xs font-bold text-white/35">
                Pick a PC platform and fill in its ID.
              </p>
            )}
          </>
        )}
        <FieldError>{fe.device}</FieldError>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagram">INSTAGRAM (OPTIONAL)</Label>
        <input
          id="instagram"
          name="instagram"
          placeholder="@yourhandle"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className={authInputClass}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] font-semibold leading-relaxed text-white/55">
        <input
          key={`agree-${formNonce}`}
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
      <FieldError>{fe.agree}</FieldError>

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="mt-1 w-full rounded-[14px] p-3.5 font-baloo text-[16px] font-extrabold transition hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{
          background: canSubmit ? "#FFB800" : "rgba(255,255,255,0.06)",
          color: canSubmit ? "#1A1108" : "rgba(255,255,255,0.3)",
        }}
      >
        {pending ? "Saving…" : "Save and continue"}
      </button>

      <p className="text-center text-[12.5px] font-semibold text-white/40">
        Not you?{" "}
        <button
          type="submit"
          formAction={logout}
          formNoValidate
          className="cursor-pointer font-bold text-[#FFC833] hover:underline"
        >
          Sign out
        </button>
      </p>
    </form>
  );
}
