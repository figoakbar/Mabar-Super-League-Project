/**
 * The rules that decide whether a place in a tournament can be taken. Kept in
 * one file so registration, admin review and the slot counters shown on the
 * site all agree on what "full" and "closed" mean.
 *
 * The frontend mirrors `registrationClosesAt` in
 * mabarsuperleague/lib/tournaments/registration.ts — keep the two in step.
 */

/** Registrations that hold a place: awaiting review, or confirmed. */
export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export function isActive(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

/**
 * When registration closes, as epoch ms, or null when there is no deadline.
 * A deadline is a calendar date (`YYYY-MM-DD`) and stays open for the whole of
 * that day in Jakarta time (UTC+7), where IAGL is played.
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
