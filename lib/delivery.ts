// Delivery business rules (config-driven, no DB). Dates are UTC date-only strings (YYYY-MM-DD).

export interface TimeSlot {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: "9-12", label: "9 AM – 12 PM", startHour: 9, endHour: 12 },
  { id: "12-15", label: "12 PM – 3 PM", startHour: 12, endHour: 15 },
  { id: "15-18", label: "3 PM – 6 PM", startHour: 15, endHour: 18 },
  { id: "18-21", label: "6 PM – 9 PM", startHour: 18, endHour: 21 },
];

const WINDOW_DAYS = 30; // how far ahead delivery can be booked
const CLOSED_WEEKDAYS: number[] = []; // 0=Sun … 6=Sat — none (Qatar operates all week)
const CUTOFF_HOUR = 18; // orders placed after 18:00 need +1 extra lead day

function todayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Available delivery dates within the booking window, honouring lead time + closed days. */
export function availableDates(now: Date = new Date()): string[] {
  const start = todayUtc();
  const leadDays = now.getUTCHours() >= CUTOFF_HOUR ? 2 : 1;
  const out: string[] = [];
  for (let i = leadDays; i <= WINDOW_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    if (CLOSED_WEEKDAYS.includes(d.getUTCDay())) continue;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Time slots for a given date; slots already past (if the date is today) are unavailable. */
export function slotsForDate(dateStr: string, now: Date = new Date()): { id: string; label: string; available: boolean }[] {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const isToday = date.getTime() === todayUtc().getTime();
  return TIME_SLOTS.map((s) => ({
    id: s.id,
    label: s.label,
    available: !isToday || now.getUTCHours() < s.startHour,
  }));
}

export function isValidDeliveryDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && availableDates().includes(dateStr);
}

export function isValidSlot(dateStr: string, slotId: string): boolean {
  return slotsForDate(dateStr).some((s) => s.id === slotId && s.available);
}
