"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Package, AlertCircle, ChevronDown, FileText } from "lucide-react";
import LuxuryImage from "@/components/LuxuryImage";
import { Skeleton } from '@/components/ui/Skeleton';
import { onLive, onResync } from '@/lib/live-client';
import { formatShippingAddress } from '@/lib/qatar';

// Pulls in the invoice document, html-to-image and jspdf only once a customer opens one.
const InvoiceModal = dynamic(() => import("./InvoiceModal"));

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  variantSku: string | null;
  colorName: string | null;
  /** Resolved server-side from the ordered colour (see app/api/orders/route.ts). */
  image: string | null;
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
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);

  /** `quiet`: a live refresh re-reads in place, without flashing the loading skeleton. */
  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
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
    // The server sends order events only to this customer's own room (server.mjs).
    const offLive = onLive((event) => {
      if (event.type === 'order.statusChanged') load(true);
    });
    const offResync = onResync(() => load(true));
    return () => {
      offLive();
      offResync();
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[22px] text-primary">My Orders</h2>
        <p className="text-[13px] text-[#8A8A8A] mt-0.5">Track and review your past orders.</p>
      </div>

      {loading && (
        <div className="space-y-4" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="max-w-md border border-red-100 bg-red-50 p-6 rounded-2xl text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => load()}
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
                          <div key={it.id} className="flex items-center gap-3 py-3 text-[13px]">
                            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-cream">
                              {it.image ? (
                                <LuxuryImage
                                  src={it.image}
                                  alt={it.product?.name ?? "Product"}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-center text-[8px] uppercase tracking-widest text-secondary">
                                  Preserved
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {it.product?.slug ? (
                                <Link
                                  href={`/product/${it.product.slug}`}
                                  className="text-[#333] hover:text-primary transition-colors"
                                >
                                  {it.product.name}
                                </Link>
                              ) : (
                                <span className="text-[#333]">Product</span>
                              )}
                              <p className="text-[12px] text-[#999] mt-0.5">
                                {it.colorName ? `${it.colorName} · ` : ""}Qty {it.quantity}
                              </p>
                            </div>
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
                            {formatShippingAddress(o.shippingInfo) ? ` — ${formatShippingAddress(o.shippingInfo)}` : ""}
                          </p>
                          {o.shippingInfo.phone && <p className="text-[#999] mt-0.5">{o.shippingInfo.phone}</p>}
                        </div>
                      )}
                    </div>

                    {/* Opens the invoice in a dialog rather than navigating to the standalone
                        page, which renders inside the storefront chrome. */}
                    <div className="pt-2 border-t border-[#EEE]">
                      <button
                        onClick={() => setInvoiceOrderId(o.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#61000B] hover:bg-[#800010] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        <FileText size={14} />
                        <span>Tax Invoice (فاتورة)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {invoiceOrderId && (
          <InvoiceModal orderId={invoiceOrderId} onClose={() => setInvoiceOrderId(null)} />
        )}
      </AnimatePresence>
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
