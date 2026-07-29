// Date-range presets for the reports module. Pure + `now`-injectable so it's unit-testable.
// ponytail: UTC day boundaries; switch to Asia/Qatar if the +3h offset misreports "today".

export type RangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "last-month"
  | "year"
  | "all";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export interface ResolvedRange {
  start: Date;
  end: Date; // exclusive upper bound
  preset: RangePreset;
  label: string;
}

const startOfUTCDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

export function isRangePreset(v: string | null | undefined): v is RangePreset {
  return !!v && RANGE_PRESETS.some((p) => p.value === v);
}

/** Resolve a preset to a [start, end) window. Unknown preset falls back to 30d. */
export function resolveRange(preset: string | null | undefined, now: Date = new Date()): ResolvedRange {
  const p: RangePreset = isRangePreset(preset) ? preset : "30d";
  const label = RANGE_PRESETS.find((x) => x.value === p)!.label;
  const today = startOfUTCDay(now);
  const endOfToday = addDays(today, 1); // exclusive: covers all of "today"

  switch (p) {
    case "today":
      return { start: today, end: endOfToday, preset: p, label };
    case "yesterday":
      return { start: addDays(today, -1), end: today, preset: p, label };
    case "7d":
      return { start: addDays(today, -6), end: endOfToday, preset: p, label };
    case "30d":
      return { start: addDays(today, -29), end: endOfToday, preset: p, label };
    case "month":
      return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), end: endOfToday, preset: p, label };
    case "last-month": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { start, end, preset: p, label };
    }
    case "year":
      return { start: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), end: endOfToday, preset: p, label };
    case "all":
      return { start: new Date(0), end: endOfToday, preset: p, label };
  }
}
