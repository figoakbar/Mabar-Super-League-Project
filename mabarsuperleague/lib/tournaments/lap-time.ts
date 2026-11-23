/**
 * Lap and race times are stored as text in one shape: m:ss.mmm, or h:mm:ss.mmm
 * from an hour up (1:32.451, 28:41.337, 1:05:12.300). Admins may type the
 * digits alone (132451 → 1:32.451). Mirrors
 * backend/src/race-results/lap-time.ts, which has the final say.
 */
export const LAP_TIME_HINT =
  "Lap time must look like 1:32.451 (minutes:seconds.milliseconds), or 1:05:12.300 from an hour up.";

/** The tidy form of `input`, "" for no time, or null when it isn't a time. */
export function normalizeLapTime(input: string): string | null {
  const raw = input.trim();
  if (raw === "") return "";
  let h = 0;
  let m: number;
  let s: number;
  let ms: string;
  const digits = /^\d{5,9}$/.exec(raw);
  const short = /^(\d+):(\d{2})\.(\d{3})$/.exec(raw);
  const long = /^(\d+):(\d{2}):(\d{2})\.(\d{3})$/.exec(raw);
  if (digits) {
    // Read from the right: milliseconds, seconds, minutes, then hours.
    ms = raw.slice(-3);
    s = Number(raw.slice(-5, -3));
    m = Number(raw.slice(-7, -5) || "0");
    h = Number(raw.slice(0, -7) || "0");
  } else if (short) {
    m = Number(short[1]);
    s = Number(short[2]);
    ms = short[3];
  } else if (long) {
    h = Number(long[1]);
    m = Number(long[2]);
    s = Number(long[3]);
    ms = long[4];
    if (m > 59) return null;
  } else {
    return null;
  }
  if (s > 59) return null;
  h += Math.floor(m / 60);
  m %= 60;
  const ss = String(s).padStart(2, "0");
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${ss}.${ms}`
    : `${m}:${ss}.${ms}`;
}
