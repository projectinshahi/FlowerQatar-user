"use client";

import { useCallback, useEffect, useState } from "react";
import { errMsg } from "@/lib/error";

export interface SubDelivery {
  id: string;
  sequence: number;
  scheduledDate: string;
  status: "SCHEDULED" | "SKIPPED" | "DELIVERED" | "CANCELLED";
}
export interface SubHistory {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
}
export interface Subscription {
  id: string;
  productName: string;
  productImage: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercent: number;
  frequency: string;
  frequencyLabel: string;
  intervalCount: number;
  totalDeliveries: number | null;
  startDate: string;
  endDate: string | null;
  nextDeliveryDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED";
  remainingDeliveries: number;
  deliveredCount: number;
  skippedCount: number;
  deliveries: SubDelivery[];
  history?: SubHistory[];
  cancelReason?: string | null;
  resumeDate?: string | null;
}

type Body = Record<string, unknown>;
type Result = { ok: true; data: Subscription } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function useSubscriptions() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/subscriptions");
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.error || "Could not load your subscriptions");
      setItems(d.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load your subscriptions"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const patch = useCallback(async (id: string, path: string, body?: Body): Promise<Result> => {
    const r = await fetch(`/api/subscriptions/${id}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const d = await r.json();
    if (!r.ok || !d?.success) return { ok: false, error: d?.error || "Action failed" };
    setItems((prev) => prev.map((s) => (s.id === id ? d.data : s)));
    return { ok: true, data: d.data };
  }, []);

  const create = useCallback(async (body: Body): Promise<Result> => {
    const r = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok || !d?.success) return { ok: false, error: d?.error || "Could not create subscription", fieldErrors: d?.fieldErrors };
    setItems((prev) => [d.data, ...prev]);
    return { ok: true, data: d.data };
  }, []);

  return {
    items,
    loading,
    error,
    reload,
    create,
    pause: (id: string, b?: Body) => patch(id, "pause", b),
    resume: (id: string) => patch(id, "resume"),
    skip: (id: string, b?: Body) => patch(id, "skip", b),
    cancel: (id: string, b?: Body) => patch(id, "cancel", b),
  };
}
