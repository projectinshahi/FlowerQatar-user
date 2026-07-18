import type { SubDelivery } from "../../hooks/useSubscriptions";

const DOT: Record<string, string> = {
  SCHEDULED: "bg-primary",
  DELIVERED: "bg-green-500",
  SKIPPED: "bg-amber-400",
  CANCELLED: "bg-gray-300",
};
const LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DELIVERED: "Delivered",
  SKIPPED: "Skipped",
  CANCELLED: "Cancelled",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function DeliveryTimeline({ deliveries }: { deliveries: SubDelivery[] }) {
  const items = [...deliveries].sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
  if (!items.length) return <p className="text-[13px] text-[#999]">No deliveries scheduled.</p>;

  return (
    <ol className="relative border-l border-[#EAEAEA] ml-1.5">
      {items.map((d) => (
        <li key={d.id} className="ml-5 pb-4 last:pb-0 relative">
          <span className={`absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${DOT[d.status] ?? "bg-gray-300"}`} />
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[13px] ${d.status === "CANCELLED" || d.status === "SKIPPED" ? "text-[#9a9a9a] line-through" : "text-primary"}`}>
              {fmt(d.scheduledDate)}
            </span>
            <span
              className={`text-[10px] uppercase tracking-[0.1em] ${
                d.status === "DELIVERED" ? "text-green-600" : d.status === "SKIPPED" ? "text-amber-600" : d.status === "CANCELLED" ? "text-[#bbb]" : "text-[#8A8A8A]"
              }`}
            >
              {LABEL[d.status] ?? d.status}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
