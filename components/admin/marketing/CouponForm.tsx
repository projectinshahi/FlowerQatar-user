"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { couponSchema, type CouponFormValues, DISCOUNT_TYPES } from "@/lib/validations/marketing";
import { createCoupon, updateCoupon } from "@/lib/actions/marketing.actions";
import MultiSelect, { type Option } from "./MultiSelect";
import { toDatetimeLocal } from "./ui";

interface Props {
  productOptions: Option[];
  categoryOptions: Option[];
  initialData?: any;
}

const field = "w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1.5";

export default function CouponForm({ productOptions, categoryOptions, initialData }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(couponSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          discountValue: Number(initialData.discountValue),
          maxDiscount: initialData.maxDiscount != null ? Number(initialData.maxDiscount) : "",
          minOrderAmount: Number(initialData.minOrderAmount ?? 0),
          usageLimit: initialData.usageLimit ?? "",
          usagePerCustomer: initialData.usagePerCustomer ?? "",
          startDate: toDatetimeLocal(initialData.startDate),
          endDate: toDatetimeLocal(initialData.endDate),
          applicableCategories: initialData.applicableCategories ?? [],
          applicableProducts: initialData.applicableProducts ?? [],
          excludedCategories: initialData.excludedCategories ?? [],
          excludedProducts: initialData.excludedProducts ?? [],
        }
      : {
          code: "",
          name: "",
          description: "",
          type: "PERCENTAGE",
          discountValue: "",
          maxDiscount: "",
          minOrderAmount: 0,
          usageLimit: "",
          usagePerCustomer: "",
          startDate: "",
          endDate: "",
          autoApply: false,
          freeDelivery: false,
          status: "ACTIVE",
          priority: 0,
          applicableCategories: [],
          applicableProducts: [],
          excludedCategories: [],
          excludedProducts: [],
        },
  });

  const onSubmit = async (data: CouponFormValues) => {
    setSubmitting(true);
    try {
      const result = initialData?.id
        ? await updateCoupon(initialData.id, data)
        : await createCoupon(data);
      if (result.success) {
        toast.success(initialData?.id ? "Coupon updated" : "Coupon created");
        router.push("/admin/marketing/coupons");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const err = (name: string) =>
    (errors as any)[name] ? <p className="text-red-500 text-xs mt-1">{String((errors as any)[name].message)}</p> : null;

  const arrayField = (name: string, options: Option[], placeholder: string) => (
    <MultiSelect
      options={options}
      value={watch(name) || []}
      onChange={(v) => setValue(name, v, { shouldValidate: true, shouldDirty: true })}
      placeholder={placeholder}
    />
  );

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setValue("code", s, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
          Please fix the highlighted fields.
        </div>
      )}

      {/* Basics */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Coupon Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Coupon Code</label>
            <div className="flex gap-2">
              <input {...register("code")} className={`${field} font-mono uppercase`} placeholder="Auto-generated if blank" />
              <button type="button" onClick={generateCode} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate on save.</p>
            {err("code")}
          </div>
          <div>
            <label className={label}>Coupon Name <span className="text-red-500">*</span></label>
            <input {...register("name")} className={field} placeholder="Summer Sale" />
            {err("name")}
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea {...register("description")} rows={2} className={`${field} resize-none`} placeholder="Internal notes / customer-facing description" />
        </div>
      </section>

      {/* Discount */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Discount</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={label}>Type <span className="text-red-500">*</span></label>
            <select {...register("type")} className={field}>
              {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t === "FLAT" ? "Flat (QAR)" : "Percentage (%)"}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Discount Value <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" {...register("discountValue")} className={field} placeholder="20" />
            {err("discountValue")}
          </div>
          <div>
            <label className={label}>Max Discount</label>
            <input type="number" step="0.01" {...register("maxDiscount")} className={field} placeholder="Optional cap" />
          </div>
          <div>
            <label className={label}>Minimum Order</label>
            <input type="number" step="0.01" {...register("minOrderAmount")} className={field} placeholder="0" />
            {err("minOrderAmount")}
          </div>
        </div>
      </section>

      {/* Limits & schedule */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Usage &amp; Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={label}>Usage Limit (total)</label>
            <input type="number" step="1" {...register("usageLimit")} className={field} placeholder="Unlimited" />
          </div>
          <div>
            <label className={label}>Usage Per Customer</label>
            <input type="number" step="1" {...register("usagePerCustomer")} className={field} placeholder="Unlimited" />
          </div>
          <div>
            <label className={label}>Start Date <span className="text-red-500">*</span></label>
            <input type="datetime-local" {...register("startDate")} className={field} />
            {err("startDate")}
          </div>
          <div>
            <label className={label}>End Date <span className="text-red-500">*</span></label>
            <input type="datetime-local" {...register("endDate")} className={field} />
            {err("endDate")}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Status</label>
            <select {...register("status")} className={field}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className={label}>Priority</label>
            <input type="number" step="1" {...register("priority")} className={field} placeholder="0" />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("autoApply")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Auto Apply</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("freeDelivery")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Grants Free Delivery</span>
          </label>
        </div>
      </section>

      {/* Targeting */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Targeting</h3>
        <p className="text-xs text-gray-500 -mt-2">Leave applicable lists empty to apply to the entire catalog.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Applicable Categories</label>
            {arrayField("applicableCategories", categoryOptions, "All categories")}
          </div>
          <div>
            <label className={label}>Applicable Products</label>
            {arrayField("applicableProducts", productOptions, "All products")}
          </div>
          <div>
            <label className={label}>Excluded Categories</label>
            {arrayField("excludedCategories", categoryOptions, "None")}
          </div>
          <div>
            <label className={label}>Excluded Products</label>
            {arrayField("excludedProducts", productOptions, "None")}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black text-sm font-medium flex items-center gap-2 disabled:opacity-70">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {initialData?.id ? "Update Coupon" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}
