/**
 * Registration rules as the pages show them. The backend enforces the same
 * rules (backend/src/participants/registration-rules.ts) and has the final say;
 * this copy only lets the page explain a closed or full tournament before
 * anyone tries to submit. Keep the two in step.
 */

/**
 * When registration closes, as epoch ms, or null when there is no deadline.
 * A deadline is a calendar date and stays open for the whole of that day in
 * Jakarta time (UTC+7).
 */
export function registrationClosesAt(deadline: string): number | null {
  const value = deadline?.trim();
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59:59.999+07:00`
    : value;
  const at = Date.parse(iso);
  return Number.isNaN(at) ? null : at;
}

export function isRegistrationClosed(deadline: string, now = Date.now()): boolean {
  const closesAt = registrationClosesAt(deadline);
  return closesAt !== null && now > closesAt;
}

/** Same limits the API applies to a receipt upload. */
const RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

/** Why a chosen receipt file would be refused, or null when it is fine. */
export function receiptProblem(file: File): string | null {
  if (!RECEIPT_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, WEBP, GIF or PDF file.";
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return "That file is larger than 5 MB — send a smaller screenshot.";
  }
  return null;
}
