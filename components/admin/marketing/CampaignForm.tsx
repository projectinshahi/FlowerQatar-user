"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { freeDeliverySchema, type FreeDeliveryFormValues } from "@/lib/validations/marketing";
import { createCampaign, updateCampaign, type getCampaignById } from "@/lib/actions/marketing.actions";
import MultiSelect, { type Option } from "./MultiSelect";
import { toDatetimeLocal } from "./ui";

interface Props {
  productOptions: Option[];
  categoryOptions: Option[];
  /** The saved record when editing (as the edit page loads it). */
  initialData?: Extract<Awaited<ReturnType<typeof getCampaignById>>, { success: true }>["data"];
}

const field = "w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1.5";

export default function CampaignForm({ productOptions, categoryOptions, initialData }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FieldValues, unknown, FreeDeliveryFormValues>({
    // Same cast as AddressForm: the schema's input type is stricter than what the inputs hold.
    resolver: zodResolver(freeDeliverySchema) as unknown as Resolver<FieldValues, unknown, FreeDeliveryFormValues>,
    defaultValues: initialData
      ? {
          ...initialData,
          minOrderAmount: Number(initialData.minOrderAmount ?? 0),
          startDate: toDatetimeLocal(initialData.startDate),
          endDate: toDatetimeLocal(initialData.endDate),
          applicableCategories: initialData.applicableCategories ?? [],
          applicableProducts: initialData.applicableProducts ?? [],
        }
      : {
          name: "",
          minOrderAmount: 0,
          startDate: "",
          endDate: "",
          status: "ACTIVE",
          priority: 0,
          applicableCategories: [],
          applicableProducts: [],
        },
  });

  const onSubmit = async (data: FreeDeliveryFormValues) => {
    setSubmitting(true);
    try {
      const result = initialData?.id
        ? await updateCampaign(initialData.id, data)
        : await createCampaign(data);
      if (result.success) {
        toast.success(initialData?.id ? "Campaign updated" : "Campaign created");
        router.push("/admin/marketing/free-delivery");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error((e instanceof Error && e.message) || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const err = (name: string) =>
    errors[name] ? <p className="text-red-500 text-xs mt-1">{String(errors[name].message)}</p> : null;

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

      {/* Campaign details */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Campaign Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Campaign Name <span className="text-red-500">*</span></label>
            <input {...register("name")} className={field} placeholder="Free Delivery Weekend" />
            {err("name")}
          </div>
          <div>
            <label className={label}>Minimum Order <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" {...register("minOrderAmount")} className={field} placeholder="0" />
            {err("minOrderAmount")}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black text-sm font-medium flex items-center gap-2 disabled:opacity-70">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {initialData?.id ? "Update Campaign" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}
