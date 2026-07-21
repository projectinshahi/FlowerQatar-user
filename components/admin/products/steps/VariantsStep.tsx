"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ProductCareInput from "./ProductCareInput";
import ColorVariantsFieldArray from "./ColorVariantsFieldArray";
import VariantSpecifications from "./VariantSpecifications";
import { CATEGORY_ORDER, CATEGORY_META } from "@/lib/category-config";

type SubOption = { id: string; categoryType: string; name: string };

export default function VariantsStep({ subcategories = [] }: { subcategories?: SubOption[] }) {
  const { register, control, watch, setValue, getValues, formState: { errors } } = useFormContext();
  // Subcategory options depend on the chosen category; changing the category clears the subcategory.
  const selectedType = watch("categoryType");
  const subOptions = subcategories.filter((s) => s.categoryType === selectedType);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // A product may carry at most ONE marketing flag. Selecting one clears the rest;
  // clicking the active flag again clears it (no flag).
  const FLAGS = [
    { name: "isFeatured", label: "Featured" },
    { name: "isBestSeller", label: "Best Seller" },
    { name: "isTrending", label: "Trending" },
    { name: "isNewArrival", label: "New Arrival" },
  ] as const;

  const selectFlag = (name: string) => {
    const willEnable = !getValues(name);
    FLAGS.forEach((f) => setValue(f.name, f.name === name ? willEnable : false, { shouldDirty: true }));
  };

  const [expandedVariants, setExpandedVariants] = useState<number[]>([0]);

  const toggleExpand = (index: number) => {
    setExpandedVariants(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const addVariant = () => {
    append({
      variantName: "",
      sku: "",
      description: "",
      productCare: { dos: [], donts: [] },
      isDefault: fields.length === 0,
      isActive: true,
      specifications: [],
      colorVariants: [],
    });
    setExpandedVariants(prev => [...prev, fields.length]);
  };

  return (
    <div className="space-y-8">
      {/* Product-level information */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
        <h3 className="text-lg font-medium text-gray-900">Product Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
              placeholder="e.g. Premium Rose Bouquet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
            <input
              type="text"
              {...register("slug")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
              placeholder="Auto-generated from name if empty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
            <input
              type="text"
              {...register("sku")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm"
              placeholder="e.g. PRD-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              {...register("status")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          {/* Category system: one of the six fixed categories + a subcategory within it. */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              {...register("categoryType")}
              onChange={(e) => {
                setValue("categoryType", e.target.value, { shouldDirty: true });
                setValue("subcategoryId", "", { shouldDirty: true }); // reset dependent select
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
            >
              <option value="">Select Category</option>
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>{CATEGORY_META[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <select
              {...register("subcategoryId")}
              disabled={!selectedType}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{selectedType ? "Select Subcategory" : "Select a category first"}</option>
              {subOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
          <textarea
            {...register("shortDescription")}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-none"
            placeholder="Brief summary shown in listings..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
          <textarea
            {...register("description")}
            rows={5}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-none"
            placeholder="Full product description..."
          />
        </div>

        {/* Product flags */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Flag</label>
          <p className="text-xs text-gray-500 mb-3">Only one flag can be assigned per product.</p>
          <div className="flex flex-wrap gap-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            {FLAGS.map((f) => (
              <label key={f.name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!watch(f.name)}
                  onChange={() => selectFlag(f.name)}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                />
                <span className="text-sm text-indigo-900 font-medium">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Variants (Size / Type)</h3>
            <p className="text-sm text-gray-500">A variant is a size or edition, e.g. Standard or Grand.</p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-black transition-colors"
          >
            <Plus size={16} />
            Add Variant
          </button>
        </div>

        {/* How it works */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">How variants &amp; colors work</p>
          <p>
            Each <span className="font-medium text-gray-900">Variant</span> is a size or type of the product
            (e.g. <span className="font-medium">Standard</span>, <span className="font-medium">Grand</span>).
            Inside a variant you add one or more <span className="font-medium text-indigo-700">Colors</span> —
            and <span className="font-medium">each color</span> has its own <span className="font-medium">price,
            sale price, swatch, hover image and gallery images</span>.
          </p>
        </div>

        <div className="space-y-4 mt-4">
          {fields.map((field: any, index: number) => {
            const isExpanded = expandedVariants.includes(index);
            const varErrors = (errors.variants as any)?.[index] || {};

            return (
              <div key={field.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm border border-gray-100">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Variant</span>
                        {watch(`variants.${index}.variantName`) || `Variant ${index + 1}`}
                      </h4>
                      {varErrors.variantName && <p className="text-xs text-red-500">Name is required</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); remove(index); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      disabled={fields.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Variant Name — Size / Type <span className="text-red-500">*</span></label>
                        <input type="text" {...register(`variants.${index}.variantName`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. Standard, Grand, Small" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">SKU <span className="text-red-500">*</span></label>
                        <input type="text" {...register(`variants.${index}.sku`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. PRD-RED-SM" />
                      </div>
                    </div>

                    <div className="space-y-5 pt-5 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea {...register(`variants.${index}.description`)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="Variant description..."></textarea>
                      </div>
                      <ProductCareInput variantIndex={index} />
                    </div>

                    <VariantSpecifications variantIndex={index} />

                    <ColorVariantsFieldArray variantIndex={index} />

                    <div className="border-t border-gray-100 pt-5 flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register(`variants.${index}.isDefault`)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">Default Variant</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register(`variants.${index}.isActive`)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
