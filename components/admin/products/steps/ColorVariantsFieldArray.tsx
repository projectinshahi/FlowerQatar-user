"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import SingleMediaUploader from "../SingleMediaUploader";
import VariantImageUploader from "../VariantImageUploader";

/** The part of the form's error tree read here: whether a colour's name has an error. */
type VariantErrors = { colorVariants?: { colorName?: { message?: string } }[] }[];

function ColorVariantHeader({ variantIndex, index }: { variantIndex: number; index: number }) {
  const { control } = useFormContext();
  const colorName = useWatch({
    control,
    name: `variants.${variantIndex}.colorVariants.${index}.colorName`
  });
  return <>{colorName || `Color ${index + 1}`}</>;
}

function ColorPickerInput({ variantIndex, index }: { variantIndex: number; index: number }) {
  const { control, setValue } = useFormContext();
  const colorCode = useWatch({
    control,
    name: `variants.${variantIndex}.colorVariants.${index}.colorCode`
  });
  return (
    <input
      type="color"
      value={colorCode || "#000000"}
      onChange={(e) => setValue(`variants.${variantIndex}.colorVariants.${index}.colorCode`, e.target.value, { shouldValidate: true })}
      className="h-9 w-9 shrink-0 rounded-md border border-gray-200 cursor-pointer p-0.5"
    />
  );
}

export default function ColorVariantsFieldArray({ variantIndex }: { variantIndex: number }) {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.colorVariants`,
  });

  const [expandedColors, setExpandedColors] = useState<number[]>([0]);

  const toggleExpand = (index: number) => {
    setExpandedColors((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const addColorVariant = () => {
    append({
      colorName: "",
      colorCode: "#000000",
      price: "",
      salePrice: "",
      swatchImage: "",
      hoverImage: "",
      isActive: true,
      isDefault: fields.length === 0,
      galleryImages: [],
    });
    setExpandedColors((prev) => [...prev, fields.length]);
  };

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-md font-semibold text-indigo-900">Colors in this variant</h4>
          <p className="text-xs text-indigo-700/70">Each color has its own price, sale price &amp; images.</p>
        </div>
        <button
          type="button"
          onClick={addColorVariant}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus size={14} />
          Add Color
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const isExpanded = expandedColors.includes(index);
          const colorErrors = (errors.variants as unknown as VariantErrors | undefined)?.[variantIndex]?.colorVariants?.[index] || {};

          return (
            <div key={field.id} className="border border-indigo-200 border-l-4 border-l-indigo-400 rounded-lg bg-white overflow-hidden shadow-sm">
              <div
                className="flex items-center justify-between p-3 cursor-pointer border-b border-indigo-100 bg-indigo-50/60"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-indigo-500 font-semibold">Color</span>
                      <ColorVariantHeader variantIndex={variantIndex} index={index} />
                    </h5>
                    {colorErrors.colorName && <p className="text-xs text-red-500">Color name is required</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    disabled={fields.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-white space-y-5 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Color Name <span className="text-red-500">*</span></label>
                      <input type="text" {...register(`variants.${variantIndex}.colorVariants.${index}.colorName`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" placeholder="e.g. Crimson Red" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Color Code <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <ColorPickerInput variantIndex={variantIndex} index={index} />
                        <input
                          type="text"
                          {...register(`variants.${variantIndex}.colorVariants.${index}.colorCode`)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm font-mono uppercase"
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Price (QAR) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" {...register(`variants.${variantIndex}.colorVariants.${index}.price`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Sale Price (QAR)</label>
                      <input type="number" step="0.01" {...register(`variants.${variantIndex}.colorVariants.${index}.salePrice`)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <SingleMediaUploader
                      fieldName={`variants.${variantIndex}.colorVariants.${index}.swatchImage`}
                      label="Color Swatch"
                    />
                    <SingleMediaUploader
                      fieldName={`variants.${variantIndex}.colorVariants.${index}.hoverImage`}
                      label="Hover Image"
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <VariantImageUploader variantIndex={variantIndex} colorVariantIndex={index} />
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register(`variants.${variantIndex}.colorVariants.${index}.isDefault`)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
                      <span className="text-sm font-medium text-gray-700">Default Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register(`variants.${variantIndex}.colorVariants.${index}.isActive`)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
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
  );
}
