import React from "react";

/* Formatting helpers (safe on server & client) */

// Accepts numbers, strings, and Prisma Decimal-like objects (serialized or not).
type Numeric = number | string | { toString(): string } | null | undefined;

function toNum(value: Numeric): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return isNaN(n) ? 0 : n;
}

export function formatMoney(value: Numeric): string {
  return `QAR ${toNum(value).toFixed(2)}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  // Fixed locale + UTC so server and client render identically (avoids hydration mismatch).
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

/** ISO / Date → value for <input type="datetime-local"> (local time). */
export function toDatetimeLocal(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function discountText(
  type: "FLAT" | "PERCENTAGE",
  value: Numeric,
  maxDiscount?: Numeric
): string {
  const v = toNum(value);
  if (type === "PERCENTAGE") {
    const cap = maxDiscount != null && toNum(maxDiscount) > 0 ? ` (max ${formatMoney(maxDiscount)})` : "";
    return `${v}%${cap}`;
  }
  return formatMoney(v);
}

export function prettyType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* State badge */

const STATE_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  RUNNING: "bg-green-50 text-green-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  INACTIVE: "bg-orange-50 text-orange-700",
};

export function StateBadge({ state }: { state: string }) {
  const cls = STATE_STYLES[state] ?? "bg-gray-100 text-gray-700";
  const label = state === "ACTIVE" ? "Running" : prettyType(state);
  return (
    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${cls}`}>{label}</span>
  );
}
