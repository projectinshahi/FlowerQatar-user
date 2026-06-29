"use client";

import { useFormContext } from "react-hook-form";
import { Search } from "lucide-react";

export default function SEOStep() {
  const { register, watch } = useFormContext();
  
  const seoTitle = watch("seo.seoTitle");
  const metaDescription = watch("seo.metaDescription");
  const productName = watch("name");
  
  const displayTitle = seoTitle || productName || "Product Title";
  const displayUrl = "https://flowerqatar.com/products/slug";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-6">Search Engine Optimization</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
              <input 
                type="text" 
                {...register("seo.seoTitle")} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
                placeholder="Leave blank to use product name"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1.5">{seoTitle?.length || 0} / 60 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <textarea 
                {...register("seo.metaDescription")} 
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-none" 
                placeholder="Brief description for search results"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1.5">{metaDescription?.length || 0} / 160 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <input 
                type="text" 
                {...register("seo.keywords")} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none text-sm" 
                placeholder="e.g. bag, leather, luxury, black"
              />
              <p className="text-xs text-gray-500 mt-1.5">Comma separated list of keywords</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Engine Preview</label>
            <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-sm text-[#4d5156]">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search size={12} />
                </div>
                <span>Flower Qatar</span>
                <span className="text-gray-400">•</span>
                <span className="text-[#4d5156]">{displayUrl}</span>
              </div>
              <h4 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1 truncate">
                {displayTitle}
              </h4>
              <p className="text-[14px] text-[#4d5156] line-clamp-2 leading-snug">
                {metaDescription || "No meta description provided. Search engines will automatically generate one based on the page content."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
