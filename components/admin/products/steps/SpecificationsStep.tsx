"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

export default function SpecificationsStep() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>
          <p className="text-sm text-gray-500">Add detailed technical specs for the product.</p>
        </div>
        <button 
          type="button" 
          onClick={() => append({ title: "", value: "" })}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
          Add Spec
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 bg-gray-50">
          <p className="text-sm font-medium">No specifications added</p>
          <p className="text-xs mt-1">Click "Add Spec" to start adding technical details.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field: any, index: number) => {
            const specErrors = (errors.specifications as any)?.[index] || {};

            return (
              <div key={field.id} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input 
                    type="text" 
                    {...register(`specifications.${index}.title`)} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
                    placeholder="e.g. Dimensions, Material, Warranty..."
                  />
                  {specErrors.title && <p className="text-red-500 text-xs mt-1">Title required</p>}
                </div>
                <div className="flex-[2]">
                  <input 
                    type="text" 
                    {...register(`specifications.${index}.value`)} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
                    placeholder="e.g. 10x20x5 cm, Genuine Leather, 2 Years..."
                  />
                  {specErrors.value && <p className="text-red-500 text-xs mt-1">Value required</p>}
                </div>
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
