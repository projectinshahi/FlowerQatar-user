"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import VariantImageUploader from "../VariantImageUploader";
import SingleMediaUploader from "../SingleMediaUploader";
import ProductCareInput from "../ProductCareInput";

export default function VariantsStep({ categories = [] }: { categories?: any[] }) {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

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
      color: "",
      colorCode: "#000000",
      material: "",
      price: 0,
      salePrice: 0,
      isDefault: fields.length === 0,
      isActive: true,
      description: "",
      details: "",
      productCare: "",
      hoverImage: "",
      videoUrl: "",
      swatchImage: "",
      images: []
    });
    setExpandedVariants(prev => [...prev, fields.length]);
  };

  return (
    <div className="space-y-8">
      {/* Basic Fields */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
        <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              {...register("categoryId")} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
            >
              <option value="">Select Category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-500">Add different colors, sizes, or materials.</p>
        </div>
        <button 
          type="button" 
          onClick={addVariant}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
          Add Variant
        </button>
      </div>

      <div className="space-y-4">
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
                    <h4 className="font-medium text-gray-900 text-sm">Variant {index + 1}</h4>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Variant Name <span className="text-red-500">*</span></label>
                      <input type="text" {...register(`variants.${index}.variantName`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. Red - Small" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">SKU <span className="text-red-500">*</span></label>
                      <input type="text" {...register(`variants.${index}.sku`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. PRD-RED-SM" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Price (QAR) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" {...register(`variants.${index}.price`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Sale Price (QAR)</label>
                      <input type="number" step="0.01" {...register(`variants.${index}.salePrice`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Color Name</label>
                      <input type="text" {...register(`variants.${index}.color`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. Crimson Red" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Color Picker</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={watch(`variants.${index}.colorCode`) || "#000000"}
                          onChange={(e) => setValue(`variants.${index}.colorCode`, e.target.value, { shouldValidate: true })}
                          className="w-9 h-9 p-0.5 rounded cursor-pointer border border-gray-200" 
                        />
                        <input 
                          type="text" 
                          {...register(`variants.${index}.colorCode`)} 
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm uppercase" 
                        />
                      </div>
                    </div>
                    <div>
                      <SingleMediaUploader 
                        fieldName={`variants.${index}.swatchImage`}
                        label="Color Swatch Image"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-gray-100">
                    <SingleMediaUploader 
                      fieldName={`variants.${index}.hoverImage`}
                      label="Hover Image"
                      required
                      accept="image/*"
                      error={varErrors.hoverImage && "Hover image is required"}
                    />
                    <SingleMediaUploader 
                      fieldName={`variants.${index}.videoUrl`}
                      label="Video / Media"
                      accept="video/*,image/*"
                    />
                  </div>

                  <div className="space-y-5 pt-5 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea {...register(`variants.${index}.description`)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="Variant description..."></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Details</label>
                      <textarea {...register(`variants.${index}.details`)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="Variant details..."></textarea>
                    </div>
                    <ProductCareInput index={index} />
                  </div>
                  
                  <div className="border-t border-gray-100 pt-5">
                    <VariantImageUploader variantIndex={index} />
                  </div>

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
