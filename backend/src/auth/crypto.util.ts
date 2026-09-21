import { createHash, randomBytes } from "node:crypto";

/** A cryptographically random, URL-safe token handed to the client. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Only the hash of a session token is persisted. Tokens are already
 * high-entropy random values, so a plain SHA-256 (no salt) is appropriate and
 * keeps lookups indexable.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
