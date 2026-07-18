"use client";

import type { AddOn } from "@/hooks/useProductOptions";

const qar = (n: number) => `QAR ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PriceSummary({
  basePrice,
  quantity,
  addOns,
  subtotal,
}: {
  basePrice: number;
  quantity: number;
  addOns: AddOn[];
  subtotal: number;
}) {
  return (
    <div className="rounded-xl bg-[#FAF8F4] border border-[#EFEAE1] p-4 text-[13px]">
      <div className="flex justify-between text-[#666]">
        <span>Base price {quantity > 1 && <span className="text-[#9a9a9a]">× {quantity}</span>}</span>
        <span>{qar(basePrice * quantity)}</span>
      </div>
      {addOns.map((a) => (
        <div key={a.id} className="flex justify-between text-[#666] mt-1">
          <span>{a.name} {quantity > 1 && <span className="text-[#9a9a9a]">× {quantity}</span>}</span>
          <span>{qar(a.price * quantity)}</span>
        </div>
      ))}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#EAE3D7]">
        <span className="text-primary font-medium uppercase tracking-[0.1em] text-[11px]">Subtotal</span>
        <span className="text-primary font-serif text-[18px]">{qar(subtotal)}</span>
      </div>
    </div>
  );
}
