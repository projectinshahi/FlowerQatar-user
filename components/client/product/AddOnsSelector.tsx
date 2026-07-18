"use client";

import { Check, Loader2, AlertCircle, Gift } from "lucide-react";
import { useAddOns, type AddOn } from "@/hooks/useProductOptions";

export default function AddOnsSelector({ selected, onChange }: { selected: AddOn[]; onChange: (a: AddOn[]) => void }) {
  const { data, loading, error, reload } = useAddOns();
  const isSel = (id: string) => selected.some((a) => a.id === id);
  const toggle = (a: AddOn) => onChange(isSel(a.id) ? selected.filter((s) => s.id !== a.id) : [...selected, a]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-[#F1F1F1]" />)}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <span className="flex items-center gap-1.5"><AlertCircle size={14} /> {error}</span>
        <button type="button" onClick={reload} className="underline uppercase tracking-[0.1em] text-[11px]">Retry</button>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <p className="text-[12px] text-[#999] flex items-center gap-1.5"><Gift size={14} /> No add-ons available.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {data.map((a) => {
        const on = isSel(a.id);
        return (
          <button
            key={a.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(a)}
            className={`relative text-left rounded-lg border p-3 transition-colors ${on ? "border-primary bg-primary/5" : "border-[#E4DED4] hover:border-primary/50"}`}
          >
            {on && <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center"><Check size={11} /></span>}
            <p className="text-[13px] text-primary font-medium leading-tight pr-4">{a.name}</p>
            <p className="text-[11px] text-[#8A8A8A] mt-0.5">+QAR {a.price.toLocaleString()}</p>
          </button>
        );
      })}
    </div>
  );
}
