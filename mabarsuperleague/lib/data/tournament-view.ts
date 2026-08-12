// Presentation helpers that turn backend tournament data into the display
// values the public pages render. No mock data lives here — everything is
// derived from what the backend actually stores.

const ACCENTS = [
  "#4FA3E0",
  "#8E7BFF",
  "#E06055",
  "#4FBF8B",
  "#E0A04F",
  "#D9479A",
];

/** Stable accent colour derived from a name (game or tournament). */
export function accentFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(h) % ACCENTS.length];
}

// Tier accent colours — kept in sync with the How to Play tier cards so a
// tournament reads the same colour everywhere (Minor blue, Major purple,
// Championship gold, Exhibition a neutral grey since it earns no points).
const TIER_ACCENTS: Record<string, string> = {
  minor: "#4FA3E0",
  major: "#8E7BFF",
  championship: "#FFB800",
  exhibition: "#8B93A7",
};

/** Accent colour for a tournament tier. */
export function tierAccent(tier: string): string {
  return TIER_ACCENTS[tier] ?? TIER_ACCENTS.minor;
}

/** Short, capitalised tier name for a compact label ("Minor", "Championship"). */
export function tierShort(tier: string): string {
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "";
}

const AVATAR_BGS = [
  "linear-gradient(160deg, #4FA3E0, #2B6FA8)",
  "linear-gradient(160deg, #8E7BFF, #5B3FD4)",
  "linear-gradient(160deg, #D9479A, #A32E72)",
  "linear-gradient(160deg, #4FBF8B, #2F8A5E)",
  "linear-gradient(160deg, #E06055, #A83A31)",
  "linear-gradient(160deg, #E0A04F, #A8742E)",
];

/** Stable avatar gradient derived from a player name. */
export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_BGS[Math.abs(h) % AVATAR_BGS.length];
}

/** Two-letter initials for an avatar tile. */
export function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

/**
 * Resolve a stored avatar to a usable src. Google gives an absolute URL, while
 * our own uploads are backend-relative ("/uploads/…").
 */
export function avatarSrc(
  avatarUrl: string | null | undefined,
  apiOrigin: string,
): string | null {
  if (!avatarUrl) return null;
  return /^https?:\/\//.test(avatarUrl) ? avatarUrl : `${apiOrigin}${avatarUrl}`;
}

/** Rupiah formatting; a zero entry fee reads as "Free". */
export function rupiah(n: number): string {
  return n === 0 ? "Free" : `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO/date string as "30 Jul 2026"; passes through if unparseable. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
