"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { promotionSchema, type PromotionFormValues } from "@/lib/validations/marketing";
import { createPromotion, updatePromotion } from "@/lib/actions/marketing.actions";

interface Props {
  initialData?: { id?: string; title?: string };
}

const field = "w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white";
const label = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PromotionForm({ initialData }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema) as never,
    defaultValues: { title: initialData?.title ?? "" },
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Promotion Details</h3>
        <div>
          <label htmlFor="promotion-title" className={label}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="promotion-title"
            autoFocus
            {...register("title")}
            className={field}
            placeholder="Diwali Mega Sale"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "promotion-title-err" : undefined}
          />
          {errors.title && (
            <p id="promotion-title-err" role="alert" className="text-red-500 text-xs mt-1">
              {String(errors.title.message)}
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black text-sm font-medium flex items-center gap-2 disabled:opacity-70"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {initialData?.id ? "Update Promotion" : "Create Promotion"}
        </button>
      </div>
    </form>
  );
}
