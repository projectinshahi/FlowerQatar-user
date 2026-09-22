"use client";

import { Loader2, AlertCircle, Calendar } from "lucide-react";
import { useDeliveryDates, useDeliverySlots } from "@/hooks/useProductOptions";
import { formatUtcDate } from "@/lib/utils";

const fmtDay = (d: string) => formatUtcDate(d, { weekday: "short", timeZone: "UTC" });
const fmtDate = (d: string) => formatUtcDate(d, { day: "numeric", month: "short", timeZone: "UTC" });

export default function DeliveryScheduler({
  date,
  slot,
  onDate,
  onSlot,
}: {
  date: string | null;
  slot: string | null;
  onDate: (d: string) => void;
  onSlot: (s: string) => void;
}) {
  const { data: dates, loading: dLoading, error: dError, reload: dReload } = useDeliveryDates();
  const { data: slots, loading: sLoading, error: sError } = useDeliverySlots(date);

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div>
        <span className="font-sans text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-primary">
          <Calendar size={13} /> Delivery Date
        </span>
        {dLoading ? (
          <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 w-16 rounded-lg skeleton" />)}</div>
        ) : dError ? (
          <div className="flex items-center gap-2 text-[12px] text-red-500"><AlertCircle size={14} /> {dError} <button type="button" onClick={dReload} className="underline">Retry</button></div>
        ) : !dates?.length ? (
          <p className="text-[12px] text-[#999]">No delivery dates available.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.slice(0, 21).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDate(d)}
                aria-pressed={date === d}
                className={`shrink-0 w-16 py-2 rounded-lg border text-center transition-colors ${date === d ? "border-primary bg-primary/5 text-primary" : "border-[#E4DED4] text-[#666] hover:border-primary/50"}`}
              >
                <span className="block text-[10px] uppercase tracking-[0.1em]">{fmtDay(d)}</span>
                <span className="block text-[12px] font-medium mt-0.5">{fmtDate(d)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time slots */}
      {date && (
        <div>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-widest mb-3 block text-primary">Delivery Time</span>
          {sLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-[#999]"><Loader2 size={14} className="animate-spin" /> Loading slots…</div>
          ) : sError ? (
            <p className="text-[12px] text-red-500 flex items-center gap-1.5"><AlertCircle size={14} /> {sError}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(slots || []).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.available}
                  onClick={() => onSlot(s.id)}
                  aria-pressed={slot === s.id}
                  className={`py-2.5 rounded-lg border text-[12px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${slot === s.id ? "border-primary bg-primary/5 text-primary" : "border-[#E4DED4] text-[#666] hover:border-primary/50"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
