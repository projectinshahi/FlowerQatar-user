"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errMsg } from "@/lib/error";

export interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}
export interface GreetingTemplate {
  id: string;
  name: string;
  image: string | null;
}
export interface Slot {
  id: string;
  label: string;
  available: boolean;
}

/** Generic loader with loading/error/reload for the M05 catalog + delivery endpoints. */
function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error(d?.error || "Request failed");
      setData(d.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load"));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export const useAddOns = () => useFetch<AddOn[]>("/api/addons");
export const useGreetingCards = () => useFetch<GreetingTemplate[]>("/api/greeting-cards");
export const useDeliveryDates = () => useFetch<string[]>("/api/delivery/dates");
export const useDeliverySlots = (date: string | null) =>
  useFetch<Slot[]>(date ? `/api/delivery/slots?date=${date}` : null);

/** Pure, memoized price calculator: base (size/color) + selected add-ons × quantity. No API calls. */
export function usePriceCalculator(basePrice: number, quantity: number, selectedAddOns: AddOn[]) {
  return useMemo(() => {
    const addOnsTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
    const unitPrice = basePrice + addOnsTotal;
    const subtotal = unitPrice * Math.max(1, quantity);
    return { basePrice, addOnsTotal, unitPrice, subtotal };
  }, [basePrice, quantity, selectedAddOns]);
}
