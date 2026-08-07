"use client";

import { useState, useRef } from "react";
import { Upload, X, Star, GripHorizontal, Film, Play, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

export default function VariantImageUploader({
  variantIndex,
  colorVariantIndex,
}: {
  variantIndex: number;
  colorVariantIndex: number;
}) {
  const { watch, setValue } = useFormContext();
  const categoryType = watch("categoryType");
  const isBlushingBlooms = categoryType === "BLUSHING_BLOOMS";

  const images =
    watch(`variants.${variantIndex}.colorVariants.${colorVariantIndex}.galleryImages`) || [];
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, isVideo: boolean) => {
    if (!file) return;

    if (isVideo && file.size > 100 * 1024 * 1024) {
      setUploadError("Video must be under 100MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadType(isVideo ? "video" : "image");
      setUploadProgress(0);
      setUploadError(null);

      // 1. Get signature from our API
      const sigResponse = await fetch("/api/admin/cloudinary/signature");
      const sigData = await sigResponse.json();

      if (!sigResponse.ok) {
        throw new Error(sigData.error || "Failed to get upload signature");
      }

      // 2. Upload to Cloudinary with progress tracking
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
      formData.append("folder", "flower_products");

      const endpoint = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;

      const uploadData: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(new Error("Invalid JSON response from Cloudinary"));
            }
          } else {
            let msg = "Upload failed";
            try {
              msg = JSON.parse(xhr.responseText)?.error?.message || msg;
            } catch {
              /* ignore */
            }
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      const mediaType: "image" | "video" =
        isVideo || uploadData.resource_type === "video" ? "video" : "image";

      const newMedia = {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        type: mediaType,
        isPrimary: images.length === 0 && mediaType === "image",
        order: images.length,
      };

      setValue(
        `variants.${variantIndex}.colorVariants.${colorVariantIndex}.galleryImages`,
        [...images, newMedia],
        { shouldDirty: true, shouldValidate: true }
      );
    } catch (error: any) {
      console.error("Error uploading media:", error);
      setUploadError(error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    // Ensure one primary image remains if the removed item was primary
    if (removed?.isPrimary && newImages.length > 0) {
      const firstImgIndex = newImages.findIndex(
        (img: any) => img.type !== "video" && !img.url?.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i)
      );
      if (firstImgIndex !== -1) {
        newImages[firstImgIndex].isPrimary = true;
      } else {
        newImages[0].isPrimary = true;
      }
    }
    setValue(
      `variants.${variantIndex}.colorVariants.${colorVariantIndex}.galleryImages`,
      newImages,
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const setPrimary = (index: number) => {
    const newImages = images.map((img: any, i: number) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue(
      `variants.${variantIndex}.colorVariants.${colorVariantIndex}.galleryImages`,
      newImages,
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isVideoItem = (img: any) =>
    img.type === "video" ||
    (typeof img.url === "string" &&
      (img.url.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i) || img.url.includes("/video/upload/")));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Gallery Media
            {isBlushingBlooms && (
              <span className="text-[11px] font-normal px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                Images &amp; Videos enabled
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBlushingBlooms
              ? "Upload photos and product showcase videos for this Blushing Blooms item."
              : "Upload multiple gallery images for this color."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Image upload button */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
            <Upload size={14} />
            <span>Upload Image</span>
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, false);
                e.target.value = "";
              }}
              disabled={isUploading}
            />
          </label>

          {/* Video upload button (specifically enabled for Blushing Blooms) */}
          {isBlushingBlooms && (
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
              <Film size={14} />
              <span>Upload Video</span>
              <input
                ref={videoInputRef}
                type="file"
                className="hidden"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, true);
                  e.target.value = "";
                }}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Upload progress banner */}
      {isUploading && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs font-medium text-indigo-900 mb-1">
              <span>Uploading {uploadType}...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 bg-gray-50">
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No gallery media uploaded</p>
          <p className="text-xs mt-1 text-gray-400">
            {isBlushingBlooms
              ? "Upload photos or video clips (MP4/WebM/MOV) for this variant"
              : "Upload multiple gallery images for this color"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img: any, idx: number) => {
            const isVideo = isVideoItem(img);
            return (
              <div
                key={idx}
                className="relative group bg-gray-900 border border-gray-200 rounded-xl overflow-hidden aspect-square"
              >
                {isVideo ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    <video
                      src={img.url}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm">
                        <Play size={16} className="fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 z-10 bg-rose-600/90 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">
                      <Film size={10} /> Video
                    </span>
                  </div>
                ) : (
                  <img
                    src={img.url}
                    alt={`Preview ${idx}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Hover overlay with management controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                  <div className="flex justify-between items-start">
                    <button
                      type="button"
                      className="text-white/80 hover:text-white cursor-move p-1 rounded hover:bg-white/10"
                      title="Reorder"
                    >
                      <GripHorizontal size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-white/80 hover:text-red-400 p-1 rounded hover:bg-white/10"
                      title="Remove"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className={`flex-1 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        img.isPrimary
                          ? "bg-yellow-500 text-white shadow-sm"
                          : "bg-white/20 text-white hover:bg-white/40"
                      }`}
                    >
                      <Star size={10} className={img.isPrimary ? "fill-white" : ""} />
                      {img.isPrimary ? "Primary" : "Set Primary"}
                    </button>
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
