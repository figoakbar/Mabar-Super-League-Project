/**
 * One password policy, shared by registration, password reset, and the profile
 * password change, so a password that is refused in one place is refused in all
 * of them.
 *
 * Length does most of the work here. We deliberately do not demand a capital
 * letter or a symbol: those rules push people towards predictable shapes like
 * "Password1!" without adding much that an attacker has to guess. What we do
 * insist on is length, a mix of letters and digits, and that the password is
 * neither a well-known one nor the person's own name.
 */

export const PASSWORD_MIN_LENGTH = 10;

/** Passwords that show up at the top of every breach list. */
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "abc123",
  "abcd1234",
  "letmein",
  "welcome",
  "welcome1",
  "iloveyou",
  "admin123",
  "monkey",
  "dragon",
  "football",
  "sunshine",
  "princess",
  "whatever",
  "gaming123",
  "valorant",
  "mobilelegends",
]);

/** A run of the same character, or a plain ascending/descending sequence. */
function isTooRepetitive(pw: string): boolean {
  if (/^(.)\1+$/.test(pw)) return true;
  const lower = pw.toLowerCase();
  const asc = "abcdefghijklmnopqrstuvwxyz0123456789";
  const desc = [...asc].reverse().join("");
  return asc.includes(lower) || desc.includes(lower);
}

/**
 * Every rule the password breaks, in the order we want them read. An empty
 * array means the password is acceptable.
 */
export function passwordProblems(
  password: string,
  who: { username?: string; email?: string } = {},
): string[] {
  const problems: string[] = [];
  const pw = password ?? "";

  if (pw.length < PASSWORD_MIN_LENGTH) {
    problems.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    problems.push("Mix in at least one letter and one number.");
  }

  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || isTooRepetitive(pw)) {
    problems.push("That password is too easy to guess — pick something else.");
  }

  const name = (who.username ?? "").trim().toLowerCase();
  const mailbox = (who.email ?? "").split("@")[0]?.trim().toLowerCase() ?? "";
  const ownName = [name, mailbox].filter((v) => v.length >= 3);
  if (ownName.some((v) => lower.includes(v))) {
    problems.push("Don't use your username or email in your password.");
  }

  return problems;
}
