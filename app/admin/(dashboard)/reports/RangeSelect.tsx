"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RANGE_PRESETS } from "@/lib/reports/range";

export default function RangeSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("range") ?? "30d";

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/admin/reports?range=${e.target.value}`)}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
    >
      {RANGE_PRESETS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
