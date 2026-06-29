"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

export default function FAQStep() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
          <p className="text-sm text-gray-500">Add common questions and answers about this product.</p>
        </div>
        <button 
          type="button" 
          onClick={() => append({ question: "", answer: "" })}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500 bg-gray-50">
          <p className="text-sm font-medium">No FAQs added</p>
          <p className="text-xs mt-1">Click "Add FAQ" to start adding questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field: any, index: number) => {
            const faqErrors = (errors.faqs as any)?.[index] || {};

            return (
              <div key={field.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="space-y-4 pr-10">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Question</label>
                    <input 
                      type="text" 
                      {...register(`faqs.${index}.question`)} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm bg-white" 
                      placeholder="e.g. Is this product waterproof?"
                    />
                    {faqErrors.question && <p className="text-red-500 text-xs mt-1">Question required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Answer</label>
                    <textarea 
                      {...register(`faqs.${index}.answer`)} 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm bg-white resize-none" 
                      placeholder="e.g. Yes, it is fully waterproof up to 50 meters."
                    />
                    {faqErrors.answer && <p className="text-red-500 text-xs mt-1">Answer required</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
