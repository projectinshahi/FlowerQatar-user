"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Copy, Power, PowerOff } from "lucide-react";
import {
  deletePromotion,
  duplicatePromotion,
  bulkDeletePromotions,
  bulkSetPromotionStatus,
  type getPromotions,
} from "@/lib/actions/marketing.actions";
import { PROMOTION_TYPES } from "@/lib/validations/marketing";
import { StateBadge, discountText, formatDate, prettyType } from "./ui";

type ListData = Extract<Awaited<ReturnType<typeof getPromotions>>, { success: true }>["data"];

export default function PromotionsClient({
  promotions,
  pagination,
  params,
}: {
  promotions: ListData["promotions"];
  pagination: ListData["pagination"];
  params: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState(params.search || "");

  const setParam = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.delete("page");
    router.push(`/admin/marketing/promotions?${sp.toString()}`);
  };

  const goPage = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(page));
    router.push(`/admin/marketing/promotions?${sp.toString()}`);
  };

  const toggleAll = () => setSelected(selected.length === promotions.length ? [] : promotions.map((p) => p.id));
  const toggleOne = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.success === false) toast.error(res.error);
      else toast.success(okMsg);
      setSelected([]);
      router.refresh();
    });

  const onDelete = (id: string) => {
    if (!confirm("Delete this promotion? This cannot be undone.")) return;
    run(() => deletePromotion(id), "Promotion deleted");
  };

  const filterSelect = (key: string, opts: [string, string][], allLabel: string) => (
    <select
      value={params[key] || ""}
      onChange={(e) => setParam({ [key]: e.target.value || undefined })}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-gray-900 outline-none"
    >
      <option value="">{allLabel}</option>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage promotional campaigns.</p>
        </div>
        <Link href="/admin/marketing/promotions/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors">
          <Plus size={18} /> New Promotion
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setParam({ search: search || undefined }); }}
          className="relative flex-1"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Search size={18} /></div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          {filterSelect("state", [["RUNNING", "Running"], ["SCHEDULED", "Scheduled"], ["EXPIRED", "Expired"]], "All States")}
          {filterSelect("status", [["ACTIVE", "Active"], ["INACTIVE", "Inactive"]], "All Status")}
          {filterSelect("promotionType", PROMOTION_TYPES.map((t) => [t, prettyType(t)] as [string, string]), "All Types")}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {selected.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">{selected.length} selected</span>
            <div className="flex gap-2">
              <button disabled={isPending} onClick={() => run(() => bulkSetPromotionStatus(selected, "ACTIVE"), "Promotions enabled")} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100">Enable</button>
              <button disabled={isPending} onClick={() => run(() => bulkSetPromotionStatus(selected, "INACTIVE"), "Promotions disabled")} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md font-medium hover:bg-orange-100">Disable</button>
              <button disabled={isPending} onClick={() => { if (confirm("Delete selected promotions?")) run(() => bulkDeletePromotions(selected), "Promotions deleted"); }} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-md font-medium hover:bg-red-100">Delete</button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input type="checkbox" checked={promotions.length > 0 && selected.length === promotions.length} onChange={toggleAll} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                </th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-500">No promotions found.</td></tr>
              ) : promotions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  </td>
                  <td className="px-4 py-3"><span className="font-medium text-gray-900">{p.title}</span>{p.autoApply && <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5">AUTO</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{prettyType(p.promotionType)}</td>
                  <td className="px-4 py-3 text-gray-900">{discountText(p.discountType, p.discountValue, p.maxDiscount)}</td>
                  <td className="px-4 py-3"><StateBadge state={p.state} /></td>
                  <td className="px-4 py-3 text-gray-600">{p.priority}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/marketing/promotions/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md" title="Edit"><Edit size={16} /></Link>
                      <button disabled={isPending} onClick={() => run(() => duplicatePromotion(p.id), "Promotion duplicated")} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md" title="Duplicate"><Copy size={16} /></button>
                      {p.status === "ACTIVE" ? (
                        <button disabled={isPending} onClick={() => run(() => bulkSetPromotionStatus([p.id], "INACTIVE"), "Promotion disabled")} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md" title="Disable"><PowerOff size={16} /></button>
                      ) : (
                        <button disabled={isPending} onClick={() => run(() => bulkSetPromotionStatus([p.id], "ACTIVE"), "Promotion enabled")} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md" title="Enable"><Power size={16} /></button>
                      )}
                      <button onClick={() => onDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Showing {promotions.length} of {pagination.total} promotions</div>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => goPage(pagination.page - 1)} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => goPage(pagination.page + 1)} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
