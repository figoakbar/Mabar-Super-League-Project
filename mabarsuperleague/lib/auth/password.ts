/**
 * The password rules, mirrored from the backend policy so the form can tell
 * someone what is wrong while they type instead of after a round trip. The API
 * remains the authority — this copy exists for feedback, not for enforcement.
 *
 * Length carries the weight. We deliberately do not demand a capital letter or
 * a symbol: those rules push people towards predictable shapes like
 * "Password1!" without adding much an attacker has to guess.
 */

export const PASSWORD_MIN_LENGTH = 10;

const COMMON = new Set([
  "password", "password1", "password123", "passw0rd",
  "123456", "1234567", "12345678", "123456789", "1234567890",
  "qwerty", "qwerty123", "qwertyuiop", "abc123", "abcd1234",
  "letmein", "welcome", "welcome1", "iloveyou", "admin123",
  "monkey", "dragon", "football", "sunshine", "princess",
  "whatever", "gaming123", "valorant", "mobilelegends",
]);

function isTooRepetitive(pw: string): boolean {
  if (/^(.)\1+$/.test(pw)) return true;
  const lower = pw.toLowerCase();
  const asc = "abcdefghijklmnopqrstuvwxyz0123456789";
  const desc = [...asc].reverse().join("");
  return asc.includes(lower) || desc.includes(lower);
}

export type PasswordRule = { label: string; ok: boolean };

/** The rules as a live checklist, for showing beneath the field. */
export function passwordRules(
  password: string,
  who: { username?: string; email?: string } = {},
): PasswordRule[] {
  const pw = password ?? "";
  const lower = pw.toLowerCase();
  const mailbox = (who.email ?? "").split("@")[0]?.trim().toLowerCase() ?? "";
  const ownName = [(who.username ?? "").trim().toLowerCase(), mailbox].filter(
    (v) => v.length >= 3,
  );

  return [
    {
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      ok: pw.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: "A letter and a number",
      ok: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw),
    },
    {
      label: "Not an easily guessed password",
      ok: pw.length > 0 && !COMMON.has(lower) && !isTooRepetitive(pw),
    },
    {
      label: "Doesn't contain your username or email",
      ok: pw.length > 0 && !ownName.some((v) => lower.includes(v)),
    },
  ];
}

/** Every rule the password breaks; empty means acceptable. */
export function passwordProblems(
  password: string,
  who: { username?: string; email?: string } = {},
): string[] {
  return passwordRules(password, who)
    .filter((r) => !r.ok)
    .map((r) => r.label);
}

/** True when the password satisfies every rule. */
export function passwordOk(
  password: string,
  who: { username?: string; email?: string } = {},
): boolean {
  return passwordProblems(password, who).length === 0;
}
