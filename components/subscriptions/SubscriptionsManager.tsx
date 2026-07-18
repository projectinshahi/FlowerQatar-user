"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Repeat, AlertCircle, Loader2, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useSubscriptions, type Subscription } from "../../hooks/useSubscriptions";
import SubscriptionCard from "./SubscriptionCard";
import CreateSubscriptionModal from "./CreateSubscriptionModal";
import DeliveryTimeline from "./DeliveryTimeline";
import StatusBadge from "./StatusBadge";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function Backdrop({ onClose }: { onClose: () => void }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />;
}

export default function SubscriptionsManager() {
  const { addToast } = useApp();
  const { items, loading, error, reload, create, pause, resume, skip, cancel } = useSubscriptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Subscription | null>(null);
  const [pauseFor, setPauseFor] = useState<Subscription | null>(null);
  const [skipFor, setSkipFor] = useState<Subscription | null>(null);
  const [cancelFor, setCancelFor] = useState<Subscription | null>(null);

  // pause form
  const [resumeDate, setResumeDate] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const run = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) => {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (res.ok) {
      addToast(okMsg, "success");
      after?.();
    } else addToast(res.error || "Something went wrong", "error");
  };

  const nextScheduled = (s: Subscription) =>
    [...s.deliveries].filter((d) => d.status === "SCHEDULED").sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate))[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-[22px] text-primary">Subscriptions</h2>
          <p className="text-[13px] text-[#8A8A8A] mt-0.5">Subscribe &amp; save on the products you love.</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 border border-black px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-black hover:text-white transition-colors">
            <Plus size={15} /> New Subscription
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="rounded-2xl border border-[#EEE] p-5 h-52 bg-[#FAFAFA]" />)}
        </div>
      )}

      {!loading && error && (
        <div className="max-w-md border border-red-100 bg-red-50 p-6 rounded-2xl text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={() => reload()} className="border border-black px-5 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors">Try Again</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DDD] py-16 text-center">
          <Repeat className="mx-auto mb-4 text-[#C9C2B5]" size={34} />
          <p className="text-[15px] text-primary font-serif mb-1">No subscriptions yet</p>
          <p className="text-[13px] text-[#999] mb-6">Set up a recurring delivery and never run out.</p>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors">
            <Plus size={15} /> New Subscription
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {items.map((s) => (
              <SubscriptionCard
                key={s.id}
                sub={s}
                busy={busyId === s.id}
                onView={() => setDetail(s)}
                onPause={() => { setResumeDate(""); setPauseReason(""); setPauseFor(s); }}
                onResume={() => run(s.id, () => resume(s.id), "Subscription resumed")}
                onSkip={() => setSkipFor(s)}
                onCancel={() => { setCancelReason(""); setCancelFor(s); }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateSubscriptionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (body) => {
          const res = await create(body);
          if (res.ok) addToast("Subscription created.", "success");
          return res;
        }}
      />

      {/* Detail drawer */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Subscription details">
            <Backdrop onClose={() => setDetail(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-screen max-w-md bg-white h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#EEE] flex items-center justify-between">
                <h3 className="font-serif text-[19px] text-primary">Subscription details</h3>
                <button onClick={() => setDetail(null)} className="text-[#999] hover:text-primary" aria-label="Close"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] text-primary font-medium">{detail.productName}</p>
                    <StatusBadge status={detail.status} />
                  </div>
                  {detail.variantLabel && <p className="text-[12px] text-[#8A8A8A]">{detail.variantLabel}</p>}
                  <p className="text-[13px] text-[#666] mt-2">{detail.frequencyLabel} · Qty {detail.quantity} · {detail.totalPrice.toLocaleString()} QAR / delivery</p>
                  <p className="text-[13px] text-[#666]">
                    {detail.remainingDeliveries} remaining{detail.totalDeliveries ? ` of ${detail.totalDeliveries}` : " (ongoing)"} · {detail.skippedCount} skipped
                  </p>
                  {detail.cancelReason && <p className="text-[12px] text-red-500 mt-1">Cancelled: {detail.cancelReason}</p>}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A8A8A] mb-3">Delivery schedule</p>
                  <DeliveryTimeline deliveries={detail.deliveries} />
                </div>
                {detail.history && detail.history.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A8A8A] mb-3">History</p>
                    <ul className="space-y-2">
                      {detail.history.map((h) => (
                        <li key={h.id} className="text-[12px] text-[#666] flex justify-between gap-3">
                          <span>{h.action.replace(/_/g, " ").toLowerCase()}{h.note ? ` — ${h.note}` : ""}</span>
                          <span className="text-[#aaa] shrink-0">{fmt(h.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pause dialog */}
      <AnimatePresence>
        {pauseFor && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pause subscription">
            <Backdrop onClose={() => setPauseFor(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl">
              <h3 className="font-serif text-[19px] text-primary mb-1">Pause subscription</h3>
              <p className="text-[13px] text-[#888] mb-4">Deliveries stop until you resume. You can optionally schedule a resume date.</p>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5">Resume on (optional)</label>
              <input type="date" min={new Date().toISOString().slice(0, 10)} value={resumeDate} onChange={(e) => setResumeDate(e.target.value)} className="w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 outline-none focus:border-primary mb-3" />
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5">Reason (optional)</label>
              <input value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="e.g. Travelling" className="w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 outline-none focus:border-primary mb-5" />
              <div className="flex items-center gap-3">
                <button onClick={() => { const s = pauseFor; setPauseFor(null); run(s.id, () => pause(s.id, { resumeDate: resumeDate || null, reason: pauseReason || null }), "Subscription paused"); }} className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-secondary">Pause</button>
                <button onClick={() => setPauseFor(null)} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skip dialog */}
      <AnimatePresence>
        {skipFor && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Skip delivery">
            <Backdrop onClose={() => setSkipFor(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center">
              <h3 className="font-serif text-[19px] text-primary mb-1">Skip next delivery?</h3>
              <p className="text-[13px] text-[#888] mb-6">Your delivery on <strong>{fmt(nextScheduled(skipFor)?.scheduledDate ?? null)}</strong> will be skipped.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { const s = skipFor; setSkipFor(null); run(s.id, () => skip(s.id, { deliveryId: nextScheduled(s)?.id ?? null }), "Delivery skipped", () => setDetail(null)); }} className="bg-black text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-secondary">Skip Delivery</button>
                <button onClick={() => setSkipFor(null)} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary">Keep</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel dialog */}
      <AnimatePresence>
        {cancelFor && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label="Cancel subscription">
            <Backdrop onClose={() => setCancelFor(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl">
              <h3 className="font-serif text-[19px] text-primary mb-1">Cancel subscription?</h3>
              <p className="text-[13px] text-[#888] mb-1">{cancelFor.remainingDeliveries} upcoming deliver{cancelFor.remainingDeliveries === 1 ? "y" : "ies"} will be cancelled. This can&apos;t be undone.</p>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5 mt-4">Reason (optional)</label>
              <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Tell us why (optional)" className="w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 outline-none focus:border-primary mb-5" />
              <div className="flex items-center gap-3">
                <button onClick={() => { const s = cancelFor; setCancelFor(null); run(s.id, () => cancel(s.id, { reason: cancelReason || null }), "Subscription cancelled", () => setDetail(null)); }} className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-red-600">
                  {busyId === cancelFor.id && <Loader2 size={14} className="animate-spin" />} Cancel Subscription
                </button>
                <button onClick={() => setCancelFor(null)} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary">Keep it</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
