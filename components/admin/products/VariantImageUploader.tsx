"use client";

import { useState } from "react";
import { Upload, X, Star, MousePointer2, GripHorizontal } from "lucide-react";
import { useFormContext } from "react-hook-form";

// In a real application, you would use next-cloudinary or similar for the actual upload logic.
// This component simulates the upload process and manages the form state.
export default function VariantImageUploader({ variantIndex }: { variantIndex: number }) {
  const { watch, setValue } = useFormContext();
  const images = watch(`variants.${variantIndex}.images`) || [];
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // SIMULATED UPLOAD TO CLOUDINARY
    setTimeout(() => {
      const newImage = {
        url: URL.createObjectURL(file), // Temp URL for preview
        publicId: `temp_${Date.now()}`,
        isPrimary: images.length === 0,
        isHover: images.length === 1,
        isGallery: true,
        order: images.length
      };
      setValue(`variants.${variantIndex}.images`, [...images, newImage]);
      setIsUploading(false);
    }, 1000);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    // Ensure one primary image remains if possible
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    setValue(`variants.${variantIndex}.images`, newImages);
  };

  const setPrimary = (index: number) => {
    const newImages = images.map((img: any, i: number) => ({
      ...img,
      isPrimary: i === index
    }));
    setValue(`variants.${variantIndex}.images`, newImages);
  };

  const setHover = (index: number) => {
    const newImages = images.map((img: any, i: number) => ({
      ...img,
      isHover: i === index
    }));
    setValue(`variants.${variantIndex}.images`, newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Variant Images</h4>
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
          {isUploading ? "Uploading..." : "Upload Image"}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
          <Upload size={14} />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 bg-gray-50">
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No images uploaded yet</p>
          <p className="text-xs mt-1">Upload primary, hover, and gallery images</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img: any, idx: number) => (
            <div key={idx} className="relative group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden aspect-square">
              <img src={img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <button type="button" className="text-white hover:text-gray-300 cursor-move">
                    <GripHorizontal size={18} />
                  </button>
                  <button type="button" onClick={() => removeImage(idx)} className="text-white hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPrimary(idx)}
                    className={`flex-1 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-1 ${img.isPrimary ? 'bg-yellow-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                  >
                    <Star size={10} className={img.isPrimary ? 'fill-white' : ''} />
                    Primary
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setHover(idx)}
                    className={`flex-1 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-1 ${img.isHover ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                  >
                    <MousePointer2 size={10} className={img.isHover ? 'fill-white' : ''} />
                    Hover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
