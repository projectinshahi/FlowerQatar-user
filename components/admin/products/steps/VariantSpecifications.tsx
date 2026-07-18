"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

export default function VariantSpecifications({ variantIndex }: { variantIndex: number }) {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.specifications`,
  });

  return (
    <div className="space-y-4 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-medium text-gray-900">Specifications</h5>
          <p className="text-xs text-gray-500">Add key-value specifications (e.g. Material: Gold)</p>
        </div>
        <button
          type="button"
          onClick={() => append({ title: "", value: "" })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          Add Spec
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500">No specifications added.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Title (e.g. Material)"
                  {...register(`variants.${variantIndex}.specifications.${idx}.title`)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Value (e.g. 18k Gold)"
                  {...register(`variants.${variantIndex}.specifications.${idx}.value`)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
