"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, Star } from "lucide-react";
import type { Address } from "@/lib/validations/address";
import Flag from "./Flag";
import DefaultBadge from "./DefaultBadge";
import LabelGlyph from "./LabelGlyph";

export default function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const line2 = [address.city, address.stateName].filter(Boolean).join(", ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`relative rounded-2xl border p-5 bg-white transition-shadow hover:shadow-[0_6px_28px_rgba(0,0,0,0.07)] ${
        address.isDefault ? "border-primary" : "border-[#E8E8E8]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#7A7264] bg-[#F1EEE8] px-2.5 py-1 rounded-md">
          <LabelGlyph label={address.label} size={12} /> {address.label}
        </span>
        {address.isDefault && <DefaultBadge />}
      </div>

      <p className="text-[13px] text-[#555] leading-relaxed">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
        <br />
        {line2} {address.postalCode}
      </p>
      <p className="flex items-center gap-2 text-[13px] text-primary font-medium mt-2">
        <Flag code={address.countryCode} /> {address.countryName}
      </p>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F0F0F0]">
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[#666] hover:text-primary disabled:opacity-40"
          >
            <Star size={13} /> Set Default
          </button>
        )}
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[#666] hover:text-primary">
          <Pencil size={13} /> Edit
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-red-500 hover:text-red-600 disabled:opacity-40 ml-auto"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </motion.div>
  );
}
