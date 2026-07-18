"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Package, Minus, Plus, CalendarClock } from "lucide-react";
import { errMsg } from "@/lib/error";
import { FREQUENCIES } from "@/lib/validations/subscription";
import { generateDeliveryDates, frequencyLabel } from "@/lib/services/subscription/schedule";

interface CatalogItem { id: string; name: string; price: number; image: string | null }
interface AddressItem { id: string; label: string; city: string; countryName: string; isDefault: boolean }

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Every day",
  WEEKLY: "Every week",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Every month",
  EVERY_X_DAYS: "Every X days",
  EVERY_X_WEEKS: "Every X weeks",
  EVERY_X_MONTHS: "Every X months",
  SPECIFIC_WEEKDAY: "On a weekday",
  SPECIFIC_MONTH_DATE: "On a day each month",
};
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5";
const inputCls = "w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 focus:border-primary outline-none bg-white transition-colors";
const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

type SubmitBody = Record<string, unknown>;

export default function CreateSubscriptionModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (body: SubmitBody) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("WEEKLY");
  const [intervalCount, setIntervalCount] = useState(2);
  const [weekday, setWeekday] = useState(1);
  const [monthDate, setMonthDate] = useState(1);
  const [ongoing, setOngoing] = useState(false);
  const [totalDeliveries, setTotalDeliveries] = useState(6);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 864e5).toISOString().slice(0, 10));
  const [addressId, setAddressId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoadingData(true);
    let active = true;
    Promise.all([
      fetch("/api/subscriptions/catalog").then((r) => r.json()),
      fetch("/api/addresses").then((r) => r.json()),
    ])
      .then(([cat, addr]) => {
        if (!active) return;
        const items: CatalogItem[] = cat?.data ?? [];
        const addrs: AddressItem[] = addr?.data ?? [];
        setCatalog(items);
        setAddresses(addrs);
        setProductId((p) => p || items[0]?.id || "");
        setAddressId((a) => a || addrs.find((x) => x.isDefault)?.id || addrs[0]?.id || "");
      })
      .catch(() => active && setError("Could not load products or addresses"))
      .finally(() => active && setLoadingData(false));
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const product = catalog.find((c) => c.id === productId);

  const preview = useMemo(() => {
    if (!startDate) return [];
    try {
      return generateDeliveryDates(
        new Date(`${startDate}T00:00:00Z`),
        { frequency, intervalCount, weekday, monthDate },
        ongoing ? null : totalDeliveries
      ).slice(0, 6);
    } catch {
      return [];
    }
  }, [startDate, frequency, intervalCount, weekday, monthDate, ongoing, totalDeliveries]);

  const submit = async () => {
    setError("");
    if (!productId) return setError("Please choose a product");
    if (!addresses.length) return setError("Add a delivery address in your account first");
    setSaving(true);
    const res = await onCreate({
      productId,
      quantity,
      frequency,
      intervalCount,
      weekday: frequency === "SPECIFIC_WEEKDAY" ? weekday : null,
      monthDate: frequency === "SPECIFIC_MONTH_DATE" ? monthDate : null,
      totalDeliveries: ongoing ? null : totalDeliveries,
      startDate,
      addressId: addressId || null,
    });
    setSaving(false);
    if (!res.ok) setError(res.error || "Could not create subscription");
    else onClose();
  };

  const showInterval = ["EVERY_X_DAYS", "EVERY_X_WEEKS", "EVERY_X_MONTHS"].includes(frequency);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="New subscription">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={saving ? undefined : onClose} />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-lg bg-white shadow-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEE] shrink-0">
              <h3 className="font-serif text-[20px] text-primary">Subscribe &amp; Save</h3>
              <button onClick={onClose} disabled={saving} className="text-[#999] hover:text-primary" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs">{error}</div>}

              {loadingData ? (
                <div className="animate-pulse space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-[#F0F0F0] rounded-lg" />)}
                </div>
              ) : catalog.length === 0 ? (
                <p className="text-sm text-[#888] py-6 text-center">No subscribable products are available right now.</p>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Product</label>
                    <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.price.toLocaleString()} QAR
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Quantity</label>
                      <div className="flex items-center rounded-lg border border-[#E2E2E2] overflow-hidden w-max">
                        <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2.5 text-[#666] hover:bg-[#F5F5F5]"><Minus size={14} /></button>
                        <span className="px-4 text-sm text-primary tabular-nums">{quantity}</span>
                        <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="px-3 py-2.5 text-[#666] hover:bg-[#F5F5F5]"><Plus size={14} /></button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Start date</label>
                      <input type="date" className={inputCls} min={new Date().toISOString().slice(0, 10)} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Frequency</label>
                    <select className={inputCls} value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
                      {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
                    </select>
                  </div>

                  {showInterval && (
                    <div>
                      <label className={labelCls}>Every how many {frequency === "EVERY_X_DAYS" ? "days" : frequency === "EVERY_X_WEEKS" ? "weeks" : "months"}?</label>
                      <input type="number" min={1} max={365} className={inputCls} value={intervalCount} onChange={(e) => setIntervalCount(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                  )}
                  {frequency === "SPECIFIC_WEEKDAY" && (
                    <div>
                      <label className={labelCls}>Weekday</label>
                      <select className={inputCls} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                        {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
                      </select>
                    </div>
                  )}
                  {frequency === "SPECIFIC_MONTH_DATE" && (
                    <div>
                      <label className={labelCls}>Day of month</label>
                      <input type="number" min={1} max={31} className={inputCls} value={monthDate} onChange={(e) => setMonthDate(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Duration</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setOngoing(false)} className={`flex-1 py-2.5 rounded-lg border text-sm ${!ongoing ? "border-primary bg-primary/5 text-primary" : "border-[#E2E2E2] text-[#666]"}`}>Fixed count</button>
                      <button type="button" onClick={() => setOngoing(true)} className={`flex-1 py-2.5 rounded-lg border text-sm ${ongoing ? "border-primary bg-primary/5 text-primary" : "border-[#E2E2E2] text-[#666]"}`}>Until I cancel</button>
                    </div>
                    {!ongoing && (
                      <input type="number" min={1} max={52} className={`${inputCls} mt-2`} value={totalDeliveries} onChange={(e) => setTotalDeliveries(Math.min(52, Math.max(1, Number(e.target.value) || 1)))} placeholder="Number of deliveries" />
                    )}
                  </div>

                  {addresses.length > 0 && (
                    <div>
                      <label className={labelCls}>Deliver to</label>
                      <select className={inputCls} value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                        {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.city}, {a.countryName}{a.isDefault ? " (default)" : ""}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Summary + preview */}
                  <div className="rounded-xl bg-[#FAF8F4] border border-[#EFEAE1] p-4">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-[#8A8A8A] mb-2 flex items-center gap-1.5"><CalendarClock size={13} /> {frequencyLabel({ frequency, intervalCount, weekday, monthDate })}</p>
                    <div className="flex items-center justify-between text-[13px] text-primary mb-3">
                      <span>{product ? `${product.name} × ${quantity}` : "—"}</span>
                      <span className="font-medium">{product ? (product.price * quantity).toLocaleString() : 0} QAR / delivery</span>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#9a9a9a] mb-1.5">Upcoming</p>
                    <div className="flex flex-wrap gap-1.5">
                      {preview.map((d, i) => (
                        <span key={i} className="text-[11px] bg-white border border-[#E8E1D5] rounded-md px-2 py-1 text-[#6a6357] flex items-center gap-1"><Package size={10} /> {fmt(d)}</span>
                      ))}
                      {ongoing && <span className="text-[11px] text-[#9a9a9a] px-1 py-1">…ongoing</span>}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-[#EEE]">
              <button onClick={submit} disabled={saving || loadingData || !catalog.length} className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors disabled:bg-gray-300">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Creating…" : "Start Subscription"}
              </button>
              <button onClick={onClose} disabled={saving} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#666] hover:text-primary disabled:opacity-40">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
