"use client";

import { motion } from "framer-motion";
import { Calendar, Package, RefreshCw, Pause, Play, SkipForward, X, Eye } from "lucide-react";
import type { Subscription } from "../../hooks/useSubscriptions";
import StatusBadge from "./StatusBadge";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

const iconBtn =
  "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-40";

export default function SubscriptionCard({
  sub,
  busy,
  onView,
  onPause,
  onResume,
  onSkip,
  onCancel,
}: {
  sub: Subscription;
  busy?: boolean;
  onView: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const active = sub.status === "ACTIVE";
  const paused = sub.status === "PAUSED";
  const closed = sub.status === "CANCELLED" || sub.status === "COMPLETED";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl border bg-white p-5 transition-shadow hover:shadow-[0_6px_28px_rgba(0,0,0,0.07)] ${
        active ? "border-[#E8E8E8]" : paused ? "border-amber-200" : "border-[#EEE]"
      }`}
    >
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F1EEE8] shrink-0 flex items-center justify-center">
          {sub.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sub.productImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package size={22} className="text-[#B9B2A6]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] text-primary font-medium truncate">{sub.productName}</p>
              {sub.variantLabel && <p className="text-[12px] text-[#8A8A8A] truncate">{sub.variantLabel}</p>}
            </div>
            <StatusBadge status={sub.status} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#666]">
            <RefreshCw size={13} className="text-[#aaa]" />
            {sub.frequencyLabel} · Qty {sub.quantity}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F1F1F1]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#9a9a9a]">Next delivery</p>
          <p className="text-[13px] text-primary flex items-center gap-1 mt-0.5">
            <Calendar size={12} className="text-[#bbb]" />
            {active ? fmt(sub.nextDeliveryDate) : paused ? "Paused" : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#9a9a9a]">Remaining</p>
          <p className="text-[13px] text-primary mt-0.5">
            {sub.remainingDeliveries}
            {sub.totalDeliveries ? ` / ${sub.totalDeliveries}` : " (ongoing)"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#9a9a9a]">Per delivery</p>
          <p className="text-[13px] text-primary mt-0.5">
            {sub.totalPrice.toLocaleString()} QAR
            {sub.discountPercent > 0 && <span className="text-green-600 text-[11px] ml-1">-{sub.discountPercent}%</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F1F1F1]">
        <button onClick={onView} className={`${iconBtn} text-[#666] hover:text-primary`}>
          <Eye size={13} /> View
        </button>
        {active && (
          <button onClick={onSkip} disabled={busy} className={`${iconBtn} text-[#666] hover:text-primary`}>
            <SkipForward size={13} /> Skip
          </button>
        )}
        {active && (
          <button onClick={onPause} disabled={busy} className={`${iconBtn} text-[#666] hover:text-primary`}>
            <Pause size={13} /> Pause
          </button>
        )}
        {paused && (
          <button onClick={onResume} disabled={busy} className={`${iconBtn} text-green-600 hover:text-green-700`}>
            <Play size={13} /> Resume
          </button>
        )}
        {!closed && (
          <button onClick={onCancel} disabled={busy} className={`${iconBtn} text-red-500 hover:text-red-600 ml-auto`}>
            <X size={13} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}
