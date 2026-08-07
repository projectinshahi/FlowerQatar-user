"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertCircle, ChevronDown, FileText } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  variantSku: string | null;
  colorName: string | null;
  product: { name: string; slug: string } | null;
};

type Order = {
  id: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  pointsRedeemed: number;
  paymentMethod: string;
  shippingInfo: Record<string, string> | null;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  items: OrderItem[];
};

const money = (n: number) => `QAR ${Number(n || 0).toFixed(2)}`;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentLabel = (m: string) =>
  m === "POINTS" ? "Paid with points" : m === "MIXED" ? "Card + points" : "Card";

export default function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setError("Could not load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id: string, refunded: number) => {
    const msg = refunded > 0
      ? `Cancel this order? Your ${refunded} redeemed point${refunded !== 1 ? "s" : ""} will be returned to your wallet.`
      : "Cancel this order?";
    if (!confirm(msg)) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not cancel the order.");
        return;
      }
      await load();
    } catch {
      alert("Could not cancel the order.");
    } finally {
      setCancellingId(null);
    }
  };

  // Pre-shipment orders can still be cancelled by the customer.
  const cancellable = (s: string) => s === "PENDING" || s === "PROCESSING";

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-primary">My Orders</h2>
        <p className="text-[13px] text-[#8A8A8A] mt-0.5">Track and review your past orders.</p>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#EEE] h-24 bg-[#FAFAFA]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="max-w-md border border-red-100 bg-red-50 p-6 rounded-2xl text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={load}
            className="border border-black px-5 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DDD] py-16 text-center">
          <Package className="mx-auto mb-4 text-[#C9C2B5]" size={34} />
          <p className="text-[15px] text-primary font-serif mb-1">No orders yet</p>
          <p className="text-[13px] text-[#999] mb-6">When you place an order, it will appear here.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => {
            const open = expandedId === o.id;
            return (
              <div key={o.id} className="rounded-2xl border border-[#EEE] overflow-hidden">
                <button
                  onClick={() => setExpandedId(open ? null : o.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-primary text-[14px]">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[12px] text-[#999] mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[14px] font-medium text-primary">{money(o.totalAmount)}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#999] transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-[#EEE] px-5 py-5 bg-[#FCFCFC] space-y-5">
                    {/* Products */}
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#999] mb-2">Products</p>
                      <div className="divide-y divide-[#EEE]">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                            <span className="text-[#333] min-w-0">
                              {it.product?.name ?? "Product"}
                              {it.colorName ? <span className="text-[#999]"> · {it.colorName}</span> : null}
                              <span className="text-[#999]"> × {it.quantity}</span>
                            </span>
                            <span className="text-[#555] shrink-0">{money(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="text-[13px] space-y-1.5">
                      <Row label="Subtotal" value={money(o.subtotal)} />
                      <Row label="Shipping" value={o.shippingFee ? money(o.shippingFee) : "Free"} />
                      {o.tax > 0 && <Row label="Tax" value={money(o.tax)} />}
                      {o.discount > 0 && <Row label="Discount" value={`- ${money(o.discount)}`} muted />}
                      {o.pointsRedeemed > 0 && (
                        <Row label="Points redeemed" value={`- ${money(o.pointsRedeemed)}`} muted />
                      )}
                      <div className="flex justify-between pt-2 mt-1 border-t border-[#EEE] font-medium text-primary">
                        <span>Total</span>
                        <span>{money(o.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Payment + delivery */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#999] mb-1">Payment</p>
                        <p className="text-[#333]">{paymentLabel(o.paymentMethod)}</p>
                      </div>
                      {o.trackingNumber && (
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[#999] mb-1">Tracking</p>
                          <p className="text-[#333]">{o.trackingNumber}</p>
                        </div>
                      )}
                      {o.shippingInfo && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[#999] mb-1">Delivery</p>
                          <p className="text-[#333]">
                            {[o.shippingInfo.firstName, o.shippingInfo.lastName].filter(Boolean).join(" ")}
                            {o.shippingInfo.address ? ` — ${o.shippingInfo.address}` : ""}
                            {o.shippingInfo.city ? `, ${o.shippingInfo.city}` : ""}
                            {o.shippingInfo.zip ? ` ${o.shippingInfo.zip}` : ""}
                          </p>
                          {o.shippingInfo.phone && <p className="text-[#999] mt-0.5">{o.shippingInfo.phone}</p>}
                        </div>
                      )}
                    </div>

                    {/* Actions: Invoice + Cancel */}
                    <div className="pt-2 border-t border-[#EEE] flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href={`/orders/${o.id}/invoice`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#61000B] hover:bg-[#800010] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        <FileText size={14} />
                        <span>Tax Invoice (فاتورة)</span>
                      </Link>

                      {cancellable(o.status) && (
                        <button
                          onClick={() => cancel(o.id, o.pointsRedeemed)}
                          disabled={cancellingId === o.id}
                          className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === o.id ? "Cancelling…" : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#999]">{label}</span>
      <span className={muted ? "text-emerald-600" : "text-[#555]"}>{value}</span>
    </div>
  );
}
