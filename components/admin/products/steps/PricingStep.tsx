"use client";

import { useFormContext } from "react-hook-form";

export default function PricingStep() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (QAR) <span className="text-red-500">*</span></label>
          <input 
            type="number" 
            step="0.01"
            {...register("basePrice")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
          />
          {errors.basePrice && <p className="text-red-500 text-xs mt-1">{String(errors.basePrice.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (QAR)</label>
          <input 
            type="number" 
            step="0.01"
            {...register("salePrice")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compare at Price (QAR)</label>
          <input 
            type="number" 
            step="0.01"
            {...register("comparePrice")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
            placeholder="Original price before discount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (QAR)</label>
          <input 
            type="number" 
            step="0.01"
            {...register("costPrice")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
            placeholder="Your cost (for margin calculation)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Class</label>
          <select 
            {...register("taxClass")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
          >
            <option value="">No Tax</option>
            <option value="standard">Standard Tax</option>
            <option value="reduced">Reduced Tax</option>
          </select>
        </div>
      </div>
    </div>
  );
}
