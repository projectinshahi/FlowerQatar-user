/**
 * Add calendar validity (years / months / days) to a date using real calendar arithmetic.
 *
 * Months and years shift the calendar month, clamping to the last valid day so
 * end-of-month and leap years are handled correctly (no fixed 30-day logic):
 *   Jan 31 + 1 Month  -> Feb 28 (or Feb 29 in a leap year)
 *   Feb 29 + 1 Year   -> Feb 28 (non-leap target year)
 * Plain days are then added on top.
 */
export function addCalendarValidity(
  start: Date,
  v: { years?: number; months?: number; days?: number }
): Date {
  const d = new Date(start.getTime());
  const day = d.getDate();

  // Shift months/years on the 1st to avoid overflow (e.g. Jan 31 rolling into March).
  d.setDate(1);
  d.setFullYear(d.getFullYear() + (v.years ?? 0));
  d.setMonth(d.getMonth() + (v.months ?? 0));

  // Clamp the original day to the last day of the resulting month.
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDayOfMonth));

  // Then add the plain-day portion.
  d.setDate(d.getDate() + (v.days ?? 0));
  return d;
}

