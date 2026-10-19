import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * Payment receipts are private: only the entrant and IAGL admins may see one
 * (Privacy Policy §4). They live outside the public /uploads folder and are
 * served one at a time by GET /participants/:id/receipt, which checks who is
 * asking.
 */
export const RECEIPTS_DIR = join(process.cwd(), "private", "receipts");

/**
 * Accepted upload types and the extension each is stored under. The extension
 * comes from this table, never from the uploaded file's name, so a file cannot
 * be smuggled in as, say, `.html` and later served as a web page.
 */
export const RECEIPT_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export function ensureReceiptsDir(): string {
  mkdirSync(RECEIPTS_DIR, { recursive: true });
  return RECEIPTS_DIR;
}

/**
 * Disk path of a stored receipt. New rows hold a bare file name; rows from
 * before receipts were made private hold `/uploads/<name>`. `basename` reads
 * both and keeps a crafted value from walking out of the folder.
 */
export function receiptPath(stored: string): string {
  return join(RECEIPTS_DIR, basename(stored));
}

type Viewer = { username: string; role: string } | undefined;

type ParticipantRow = {
  id: string;
  team: string;
  contact: string;
  receiptUrl: string | null;
};

/**
 * The shape of a registration as the API hands it out. Everyone sees whether a
 * receipt was uploaded; only an admin or the entrant also gets the contact
 * detail and a link to the receipt itself.
 */
export function presentParticipant<T extends ParticipantRow>(row: T, viewer: Viewer) {
  const { contact, receiptUrl, ...rest } = row;
  const hasReceipt = Boolean(receiptUrl);
  const privileged = viewer?.role === "admin" || viewer?.username === row.team;
  if (!privileged) return { ...rest, hasReceipt };
  return {
    ...rest,
    contact,
    hasReceipt,
    receiptUrl: hasReceipt ? `/participants/${row.id}/receipt` : null,
  };
}
