import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/** Promisified scrypt that keeps the options overload (promisify drops it). */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

// scrypt is memory-hard and ships with Node, so there is no native build step.
// Parameters follow the OWASP password-storage guidance (N=2^16, r=8, p=1).
const N = 65536;
const r = 8;
const p = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

/** Hash a plaintext password into a self-describing `scrypt$N$r$p$salt$key` string. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(plain.normalize("NFKC"), salt, KEY_LEN, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  });
  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

/** Constant-time verification; returns false for malformed or missing hashes. */
export async function verifyPassword(
  plain: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nRaw, rRaw, pRaw, saltB64, keyB64] = parts;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(keyB64, "base64");
    const actual = await scrypt(plain.normalize("NFKC"), salt, expected.length, {
      N: Number(nRaw),
      r: Number(rRaw),
      p: Number(pRaw),
      maxmem: 256 * 1024 * 1024,
    });
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

/** A cryptographically random, URL-safe token handed to the client. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Only the hash of a session/reset token is persisted. Tokens are already
 * high-entropy random values, so a plain SHA-256 (no salt) is appropriate and
 * keeps lookups indexable.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
