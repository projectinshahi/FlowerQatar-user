"use client";

import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { Address } from "@/lib/validations/address";
import AddressCard from "./AddressCard";

export default function AddressList({
  addresses,
  busyId,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addresses: Address[];
  busyId: string | null;
  onAdd: () => void;
  onEdit: (a: Address) => void;
  onDelete: (a: Address) => void;
  onSetDefault: (a: Address) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <AnimatePresence>
        {addresses.map((a) => (
          <AddressCard
            key={a.id}
            address={a}
            busy={busyId === a.id}
            onEdit={() => onEdit(a)}
            onDelete={() => onDelete(a)}
            onSetDefault={() => onSetDefault(a)}
          />
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={onAdd}
        className="rounded-2xl border-2 border-dashed border-[#DDD] p-5 min-h-[140px] flex flex-col items-center justify-center gap-2 text-[#8A8A8A] hover:border-primary hover:text-primary transition-colors"
      >
        <span className="w-10 h-10 rounded-full border border-current flex items-center justify-center">
          <Plus size={18} />
        </span>
        <span className="text-[12px] uppercase tracking-[0.14em]">Add New Address</span>
      </button>
    </div>
  );
}
