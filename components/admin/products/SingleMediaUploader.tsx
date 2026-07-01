"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface SingleMediaUploaderProps {
  fieldName: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  accept?: string;
  error?: string;
}

export default function SingleMediaUploader({ 
  fieldName, 
  label, 
  placeholder = "https://...", 
  required,
  accept = "image/*,video/*",
  error 
}: SingleMediaUploaderProps) {
  const { watch, setValue, register } = useFormContext();
  const mediaUrl = watch(fieldName) || "";
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const sigResponse = await fetch('/api/admin/cloudinary/signature');
      const sigData = await sigResponse.json();

      if (!sigResponse.ok) {
        throw new Error(sigData.error || 'Failed to get upload signature');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp.toString());
      formData.append('signature', sigData.signature);
      formData.append('folder', 'flower_products');

      // Use auto to support both image and video
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || 'Upload failed');
      }

      setValue(fieldName, uploadData.secure_url, { shouldValidate: true });
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {mediaUrl ? (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50 flex items-center justify-center">
          {mediaUrl.match(/\.(mp4|webm|ogg)$/i) || mediaUrl.includes('video') ? (
            <video src={mediaUrl} className="max-w-full max-h-full object-contain" autoPlay muted loop />
          ) : (
            <img src={mediaUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              type="button" 
              onClick={() => setValue(fieldName, "", { shouldValidate: true })}
              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 text-xs font-medium"
              title="Remove Media"
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${isUploading ? 'bg-gray-50 border-gray-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
          <input type="file" className="hidden" accept={accept} onChange={handleUpload} disabled={isUploading} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-2"></div>
              <span className="text-xs font-medium text-gray-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={20} className="text-gray-400 mb-2" />
              <span className="text-xs font-medium text-gray-500">Click to upload</span>
            </div>
          )}
        </label>
      )}
      
      <input type="hidden" {...register(fieldName)} />
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
