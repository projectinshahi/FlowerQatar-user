"use client";

import { useFormContext } from "react-hook-form";

export default function BasicInfoStep({ categories = [], brands = [] }: { categories?: any[], brands?: any[] }) {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const description = watch("description");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            {...register("name")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
            placeholder="e.g. Premium Leather Bag"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Slug <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            {...register("slug")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
            placeholder="e.g. premium-leather-bag"
          />
          {errors.slug && <p className="text-red-500 text-xs mt-1">{String(errors.slug.message)}</p>}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select 
            {...register("categoryId")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
          >
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
          <select 
            {...register("brandId")} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm bg-white"
          >
            <option value="">Select Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
        <textarea 
          {...register("shortDescription")} 
          rows={3} 
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-none" 
          placeholder="Brief summary of the product..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          <textarea 
            {...register("description")}
            className="w-full p-4 h-64 outline-none resize-none text-sm"
            placeholder="Write a detailed product description here..."
          />
        </div>
      </div>

      <div className="pt-10">
        <label className="block text-sm font-medium text-gray-700 mb-4">Product Flags</label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isFeatured")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm text-gray-700">Featured Product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isBestSeller")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm text-gray-700">Best Seller</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isTrending")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm text-gray-700">Trending</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isNewArrival")} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-4 h-4" />
            <span className="text-sm text-gray-700">New Arrival</span>
          </label>
        </div>
      </div>
    </div>
  );
}
