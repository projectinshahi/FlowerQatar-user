import type { SubscriptionFrequency } from "@prisma/client";

/**
 * Pure delivery-schedule generation. All dates are handled as UTC date-only
 * (midnight UTC) so they map cleanly to Prisma `@db.Date` columns with no TZ drift.
 */

// Safety cap for how many delivery rows we ever materialise at once (also the
// rolling window size for unlimited subscriptions).
export const MAX_GENERATED = 52;
export const UNLIMITED_WINDOW = 12;

export interface RecurrenceConfig {
  frequency: SubscriptionFrequency;
  intervalCount: number; // "every X"
  weekday?: number | null; // 0=Sun..6=Sat  (SPECIFIC_WEEKDAY)
  monthDate?: number | null; // 1..31        (SPECIFIC_MONTH_DATE)
}

/** Strip a Date to midnight UTC. */
export function toUtcDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, n: number): Date {
  const r = toUtcDate(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** Add months, clamping the day to the last valid day of the target month. */
export function addMonths(d: Date, n: number): Date {
  const base = toUtcDate(d);
  const targetMonthDays = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n + 1, 0)).getUTCDate();
  const day = Math.min(base.getUTCDate(), targetMonthDays);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, day));
}

/** Set the day-of-month, clamped to the month's last day. */
function withMonthDate(d: Date, monthDate: number): Date {
  const days = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), Math.min(monthDate, days)));
}

/** The next date on/after `from` that falls on `weekday` (0=Sun). */
function nextWeekday(from: Date, weekday: number): Date {
  const start = toUtcDate(from);
  const diff = (weekday - start.getUTCDay() + 7) % 7;
  return addDays(start, diff);
}

/** Advance one step from the current delivery date per the recurrence rule. */
function step(current: Date, cfg: RecurrenceConfig): Date {
  const n = Math.max(1, cfg.intervalCount || 1);
  switch (cfg.frequency) {
    case "DAILY":
      return addDays(current, 1);
    case "WEEKLY":
      return addDays(current, 7);
    case "BIWEEKLY":
      return addDays(current, 14);
    case "MONTHLY":
      return addMonths(current, 1);
    case "EVERY_X_DAYS":
      return addDays(current, n);
    case "EVERY_X_WEEKS":
      return addDays(current, n * 7);
    case "EVERY_X_MONTHS":
      return addMonths(current, n);
    case "SPECIFIC_WEEKDAY":
      // every `intervalCount` weeks on the same weekday
      return addDays(current, 7 * n);
    case "SPECIFIC_MONTH_DATE":
      // same calendar day each `intervalCount` months
      return withMonthDate(addMonths(current, n), cfg.monthDate ?? current.getUTCDate());
    default:
      return addDays(current, 7);
  }
}

/** The next delivery date after `current` per the recurrence rule. */
export function nextOccurrence(current: Date, cfg: RecurrenceConfig): Date {
  return step(current, cfg);
}

/** The first delivery date, honouring weekday/month-date anchors. */
function firstDate(startDate: Date, cfg: RecurrenceConfig): Date {
  const start = toUtcDate(startDate);
  if (cfg.frequency === "SPECIFIC_WEEKDAY" && cfg.weekday != null) {
    return nextWeekday(start, cfg.weekday);
  }
  if (cfg.frequency === "SPECIFIC_MONTH_DATE" && cfg.monthDate != null) {
    const anchored = withMonthDate(start, cfg.monthDate);
    return anchored >= start ? anchored : withMonthDate(addMonths(start, 1), cfg.monthDate);
  }
  return start;
}

/**
 * Generate delivery dates.
 * @param count how many to produce (unlimited -> UNLIMITED_WINDOW). Always capped at MAX_GENERATED.
 */
export function generateDeliveryDates(startDate: Date, cfg: RecurrenceConfig, totalDeliveries: number | null): Date[] {
  const target = Math.min(totalDeliveries ?? UNLIMITED_WINDOW, MAX_GENERATED);
  const dates: Date[] = [];
  let cursor = firstDate(startDate, cfg);
  for (let i = 0; i < target; i++) {
    dates.push(cursor);
    cursor = step(cursor, cfg);
  }
  return dates;
}

/** Human label for a recurrence, e.g. "Every 2 weeks". */
export function frequencyLabel(cfg: RecurrenceConfig): string {
  const n = Math.max(1, cfg.intervalCount || 1);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  switch (cfg.frequency) {
    case "DAILY":
      return "Every day";
    case "WEEKLY":
      return "Every week";
    case "BIWEEKLY":
      return "Every 2 weeks";
    case "MONTHLY":
      return "Every month";
    case "EVERY_X_DAYS":
      return `Every ${n} day${n > 1 ? "s" : ""}`;
    case "EVERY_X_WEEKS":
      return `Every ${n} week${n > 1 ? "s" : ""}`;
    case "EVERY_X_MONTHS":
      return `Every ${n} month${n > 1 ? "s" : ""}`;
    case "SPECIFIC_WEEKDAY":
      return `Every ${n > 1 ? `${n} weeks on ` : ""}${days[cfg.weekday ?? 0]}`;
    case "SPECIFIC_MONTH_DATE":
      return `Day ${cfg.monthDate ?? 1} of every ${n > 1 ? `${n} months` : "month"}`;
    default:
      return "Recurring";
  }
}
