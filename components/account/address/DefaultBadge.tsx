import { Star } from "lucide-react";

export default function DefaultBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] bg-primary text-white px-2 py-1 rounded-md">
      <Star size={10} /> Default
    </span>
  );
}
