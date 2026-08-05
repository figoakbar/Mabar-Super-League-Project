"use client";

/**
 * Shared building blocks for picking gamer IDs per platform, used by the
 * register form and the profile editor. The picks are stored back into the
 * existing `consoleId` / `pcId` string fields, e.g. "PSN: abc · Xbox: xyz".
 */

export type Platform = {
  key: string;
  label: string;
  idLabel: string;
  placeholder: string;
};

export const CONSOLE_PLATFORMS: Platform[] = [
  { key: "PSN", label: "PlayStation", idLabel: "PSN ID", placeholder: "Your PSN Online ID" },
  { key: "Xbox", label: "Xbox", idLabel: "Xbox Gamertag", placeholder: "Your Xbox Gamertag" },
];

export const PC_PLATFORMS: Platform[] = [
  { key: "Steam", label: "Steam", idLabel: "Steam ID", placeholder: "Steam ID or profile URL" },
  { key: "Epic", label: "Epic", idLabel: "Epic username", placeholder: "Your Epic Games username" },
  { key: "Riot", label: "Riot", idLabel: "Riot ID", placeholder: "name#TAG" },
];

const SEPARATOR = " · ";

/** Join the picked platforms into one stored string, e.g. "PSN: abc · Xbox: xyz". */
export function combineIds(
  platforms: Platform[],
  picks: Record<string, string>,
): string {
  return platforms
    .filter((p) => p.key in picks && picks[p.key].trim())
    .map((p) => `${p.key}: ${picks[p.key].trim()}`)
    .join(SEPARATOR);
}

/**
 * Parse a stored string back into per-platform picks. Segments that don't match
 * a known platform (e.g. an older free-text value) are returned as `leftover`
 * so nothing the user saved before is silently dropped.
 */
export function parseIds(
  platforms: Platform[],
  raw: string,
): { picks: Record<string, string>; leftover: string } {
  const keys = new Set(platforms.map((p) => p.key));
  const picks: Record<string, string> = {};
  const leftover: string[] = [];
  for (const segment of (raw ?? "").split(SEPARATOR)) {
    const s = segment.trim();
    if (!s) continue;
    const match = s.match(/^([^:]+):\s*(.+)$/);
    if (match && keys.has(match[1].trim())) {
      picks[match[1].trim()] = match[2].trim();
    } else {
      leftover.push(s);
    }
  }
  return { picks, leftover: leftover.join(SEPARATOR) };
}

/** Complete once at least one platform is picked and every picked one has an id. */
export function deviceComplete(
  on: boolean,
  platforms: Platform[],
  picks: Record<string, string>,
): boolean {
  if (!on) return true;
  const picked = platforms.filter((p) => p.key in picks);
  return picked.length > 0 && picked.every((p) => picks[p.key].trim().length > 0);
}

/** Platform chips + an id field for each picked platform. */
export function PlatformPicker({
  legend,
  platforms,
  picks,
  onToggle,
  onId,
  inputClass,
}: {
  legend: string;
  platforms: Platform[];
  picks: Record<string, string>;
  onToggle: (key: string) => void;
  onId: (key: string, value: string) => void;
  inputClass: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <span className="text-[11px] font-extrabold tracking-[0.6px] text-white/45">
        {legend}
      </span>
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => {
          const on = p.key in picks;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onToggle(p.key)}
              aria-pressed={on}
              className="cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-bold transition-colors"
              style={{
                background: on ? "rgba(255,184,0,0.14)" : "transparent",
                borderColor: on ? "rgba(255,184,0,0.55)" : "rgba(255,255,255,0.14)",
                color: on ? "#FFB800" : "rgba(255,255,255,0.6)",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {platforms
        .filter((p) => p.key in picks)
        .map((p) => (
          <label key={p.key} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-extrabold tracking-[0.6px] text-white/45">
              {p.idLabel.toUpperCase()}
            </span>
            <input
              value={picks[p.key]}
              onChange={(e) => onId(p.key, e.target.value)}
              placeholder={p.placeholder}
              className={inputClass}
            />
          </label>
        ))}
    </div>
  );
}
