"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";

import VariantsStep from "@/components/admin/products/steps/VariantsStep";

const STEPS = [
  { id: "variants", title: "Variants, Specs & Images" },
];

export default function ProductForm({
  subcategories,
  initialData,
}: {
  subcategories?: { id: string; categoryType: string; name: string }[];
  /** Raw input values ("" for blanks, strings for numbers); the step components edit them untyped. */
  initialData?: FieldValues & { id?: string };
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // False on the server and during hydration, true once on the client — the form renders client-only.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // The inputs are untyped field values; the zod resolver turns them into ProductFormValues.
  const methods = useForm<FieldValues, unknown, ProductFormValues>({
    // Same cast as AddressForm: the schema's input type is stricter than what the inputs hold.
    resolver: zodResolver(productSchema) as unknown as Resolver<FieldValues, unknown, ProductFormValues>,
    defaultValues: initialData || {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      country: "",
      categoryType: "",
      subcategoryId: "",
      status: "DRAFT",
      isFeatured: false,
      isBestSeller: false,
      isTrending: false,
      isNewArrival: false,
      // Blank means "use the real reviews".
      rating: "",
      variants: [{
        variantName: "Default Variant",
        sku: "",
        description: "",
        productCare: { dos: [], donts: [] },
        isDefault: true,
        isActive: true,
        specifications: [],
        colorVariants: [
          {
            colorName: "",
            colorCode: "#000000",
            price: "",
            salePrice: "",
            swatchImage: "",
            hoverImage: "",
            isActive: true,
            isDefault: true,
            galleryImages: []
          }
        ]
      }],
    },
  });

  const { handleSubmit, trigger, formState: { errors } } = methods;

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: string[] = [];
    if (currentStep === 0) fieldsToValidate = ['name', 'slug', 'subcategoryId'];
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = initialData?.id
        ? await updateProduct(initialData.id, data)
        : await createProduct(data);

      if (result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error || "Failed to save product");
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium">Loading product form...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar Steps */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-4 hidden md:flex">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive ? "bg-gray-900 text-white" :
                  isCompleted ? "bg-green-100 text-green-700" :
                    "bg-gray-200 text-gray-500"
                }`}>
                {isCompleted ? <Check size={16} /> : idx + 1}
              </div>
              <span className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Form Content */}
      <div className="flex-1 p-6 md:p-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                <p className="font-bold">Please fix the following errors:</p>
                <ul className="list-disc pl-5 mt-2">
                  {Object.entries(errors).map(([key, err]) => (
                    <li key={key}>{(typeof err?.message === "string" && err.message) || "Invalid field"}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="min-h-[400px]">
              {currentStep === 0 && <VariantsStep subcategories={subcategories} />}
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Publish Product
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
