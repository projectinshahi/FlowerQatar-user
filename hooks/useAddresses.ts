"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address, AddressInput } from "@/lib/validations/address";
import { errMsg } from "@/lib/error";

const sortDefaultFirst = (l: Address[]) => [...l].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

type SaveResult =
  | { ok: true; data: Address }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Create (no id) or update one address. Never throws: a dropped connection or a reply that is
 * not JSON (a gateway error page) is a failed save like any other, so the caller's form always
 * leaves its saving state and can retry.
 */
export async function requestAddressSave(input: AddressInput, id?: string): Promise<SaveResult> {
  const reply = await fetch(id ? `/api/addresses/${id}` : "/api/addresses", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
    .then(async (res) => ({ ok: res.ok, data: await res.json() }))
    .catch(() => null);
  if (!reply) return { ok: false, error: "Could not save the address. Check your connection and try again." };
  const { data } = reply;
  if (!reply.ok || !data?.success) {
    return { ok: false, error: data?.error || "Could not save the address", fieldErrors: data?.fieldErrors };
  }
  return { ok: true, data: data.data };
}

/** Owns the address list + all mutations, keeping the UI components thin. */
export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not load your addresses");
      setAddresses(data.data);
      setError(null);
    } catch (e) {
      setError(errMsg(e, "Could not load your addresses"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const save = useCallback(async (input: AddressInput, id?: string): Promise<SaveResult> => {
    const res = await requestAddressSave(input, id);
    if (!res.ok) return res;
    const saved = res.data;
    setAddresses((prev) => {
      const existed = prev.some((a) => a.id === saved.id);
      const next = existed
        ? prev.map((a) => (a.id === saved.id ? saved : saved.isDefault ? { ...a, isDefault: false } : a))
        : [...(saved.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev), saved];
      return sortDefaultFirst(next);
    });
    return res;
  }, []);

  const remove = useCallback(
    async (addr: Address): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch(`/api/addresses/${addr.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.success) return { ok: false, error: data?.error || "Could not delete the address" };
      if (addr.isDefault) await reload();
      else setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
      return { ok: true };
    },
    [reload]
  );

  const setDefault = useCallback(
    async (addr: Address): Promise<{ ok: boolean; error?: string }> => {
      setAddresses((prev) => sortDefaultFirst(prev.map((a) => ({ ...a, isDefault: a.id === addr.id }))));
      const res = await fetch(`/api/addresses/${addr.id}/default`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        await reload();
        return { ok: false, error: data?.error || "Could not set default" };
      }
      return { ok: true };
    },
    [reload]
  );

  return { addresses, loading, error, reload, save, remove, setDefault };
}
