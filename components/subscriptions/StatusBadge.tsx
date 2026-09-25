const MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-green-50 text-green-700" },
  PAUSED: { label: "Paused", cls: "bg-amber-50 text-amber-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
  COMPLETED: { label: "Completed", cls: "bg-blue-50 text-blue-700" },
  EXPIRED: { label: "Expired", cls: "bg-gray-100 text-gray-500" },
};

export default function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? MAP.ACTIVE;
  return (
    <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-[0.12em] rounded-md font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
