"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { promotionSchema, type PromotionFormValues, DISCOUNT_TYPES, PROMOTION_TYPES } from "@/lib/validations/marketing";
import { createPromotion, updatePromotion } from "@/lib/actions/marketing.actions";
import MultiSelect, { type Option } from "./MultiSelect";
import { toDatetimeLocal, prettyType } from "./ui";

interface Props {
  productOptions: Option[];
  categoryOptions: Option[];
  initialData?: any;
}

const field = "w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PromotionForm({ productOptions, categoryOptions, initialData }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(promotionSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          discountValue: Number(initialData.discountValue),
          maxDiscount: initialData.maxDiscount != null ? Number(initialData.maxDiscount) : "",
          banner: initialData.banner ?? "",
          startDate: toDatetimeLocal(initialData.startDate),
          endDate: toDatetimeLocal(initialData.endDate),
          applicableCategories: initialData.applicableCategories ?? [],
          applicableProducts: initialData.applicableProducts ?? [],
          excludedCategories: initialData.excludedCategories ?? [],
          excludedProducts: initialData.excludedProducts ?? [],
        }
      : {
          title: "",
          description: "",
          promotionType: "FESTIVAL",
          banner: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          maxDiscount: "",
          startDate: "",
          endDate: "",
          autoApply: true,
          status: "ACTIVE",
          priority: 0,
          applicableCategories: [],
          applicableProducts: [],
          excludedCategories: [],
          excludedProducts: [],
        },
  });

  const onSubmit = async (data: PromotionFormValues) => {
    setSubmitting(true);
    try {
      const result = initialData?.id
        ? await updatePromotion(initialData.id, data)
        : await createPromotion(data);
      if (result.success) {
        toast.success(initialData?.id ? "Promotion updated" : "Promotion created");
        router.push("/admin/marketing/promotions");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
          Please fix the highlighted fields.
        </div>
      )}

      {/* Basics */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Promotion Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Title <span className="text-red-500">*</span></label>
            <input {...register("title")} className={field} placeholder="Diwali Mega Sale" />
            {err("title")}
          </div>
          <div>
            <label className={label}>Promotion Type <span className="text-red-500">*</span></label>
            <select {...register("promotionType")} className={field}>
              {PROMOTION_TYPES.map((t) => <option key={t} value={t}>{prettyType(t)}</option>)}
            </select>
            {err("promotionType")}
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea {...register("description")} rows={2} className={`${field} resize-none`} placeholder="Internal notes / customer-facing description" />
        </div>
        <div>
          <label className={label}>Banner Image URL</label>
          <input {...register("banner")} className={field} placeholder="https://example.com/banner.jpg" />
          {err("banner")}
        </div>
      </section>

      {/* Discount */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Discount</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={label}>Type <span className="text-red-500">*</span></label>
            <select {...register("discountType")} className={field}>
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
            {err("maxDiscount")}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {initialData?.id ? "Update Promotion" : "Create Promotion"}
        </button>
      </div>
    </form>
  );
}
