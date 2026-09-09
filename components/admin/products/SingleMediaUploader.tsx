"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { isVideoMedia } from "@/lib/media";
import { planChunks } from "@/lib/upload-chunks";

/**
 * Cloudinary accepts a chunked upload when each part carries an `X-Unique-Upload-Id` and a
 * `Content-Range`. Parts must be at least 5MB (the last one may be smaller), so 6MB gives a
 * safe margin.
 *
 * Why chunk at all: a single request carrying the whole file was never completing for video on
 * a slow uplink — measured against this account, a 10.6MB clip in one POST was still unfinished
 * at 120s and was killed, while the same clip in two 6MB parts finished in 98s. Each part is a
 * short request, so nothing between the browser and Cloudinary times it out.
 */
const CHUNK_BYTES = 6 * 1024 * 1024;

/** Matches the ceiling VariantImageUploader already enforces for product gallery video. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Per-part ceiling. A stalled part fails with a message instead of spinning forever. */
const PART_TIMEOUT_MS = 120_000;

type CloudinaryResponse = { secure_url?: string; public_id?: string; error?: { message?: string } };

/**
 * POST one part with XMLHttpRequest rather than fetch — fetch cannot report upload progress, and
 * a large upload with no progress is indistinguishable from a hung one. That was the whole
 * reported symptom: "stuck on Loading".
 */
function postPart(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  onBytes: (loaded: number) => void
): Promise<CloudinaryResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = PART_TIMEOUT_MS;
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onBytes(e.loaded);
    };
    xhr.onload = () => {
      let json: CloudinaryResponse = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Unexpected response from Cloudinary'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json);
      else reject(new Error(json.error?.message || `Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out — check your connection and try again'));
    xhr.send(body);
  });
}

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
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Clear immediately so picking the SAME file again re-fires change; without this a retry
    // after a failure silently did nothing.
    input.value = "";
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      setUploadError(`${isVideo ? "Video" : "Image"} must be under ${Math.round(limit / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadError(null);

    try {
      const sigResponse = await fetch("/api/admin/cloudinary/signature");
      const sigData = await sigResponse.json();
      if (!sigResponse.ok) throw new Error(sigData.error || "Failed to get upload signature");

      const endpoint = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
      const signedFields = (form: FormData) => {
        form.append("api_key", sigData.apiKey);
        form.append("timestamp", sigData.timestamp.toString());
        form.append("signature", sigData.signature);
        form.append("folder", "flower_products");
      };

      let result: CloudinaryResponse;

      if (file.size <= CHUNK_BYTES) {
        // Small enough for one request; chunk headers would only add round trips.
        const form = new FormData();
        form.append("file", file);
        signedFields(form);
        result = await postPart(endpoint, form, {}, (loaded) =>
          setProgress(Math.round((loaded / file.size) * 100))
        );
      } else {
        // Every part carries the same signed fields and the same upload id; Cloudinary
        // reassembles them and returns the asset on the final part.
        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let done = 0;
        result = {};
        for (const part of planChunks(file.size, CHUNK_BYTES)) {
          const form = new FormData();
          form.append("file", file.slice(part.start, part.sliceEnd), file.name);
          signedFields(form);
          result = await postPart(
            endpoint,
            form,
            { "X-Unique-Upload-Id": uploadId, "Content-Range": part.contentRange },
            (loaded) => setProgress(Math.round(((done + loaded) / file.size) * 100))
          );
          done = part.sliceEnd;
          setProgress(Math.round((done / file.size) * 100));
        }
      }

      if (!result.secure_url) throw new Error("Cloudinary did not return a URL for this file");
      setValue(fieldName, result.secure_url, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      console.error("Error uploading media:", error);
      // Inline, not alert(): an alert loses the reason and blocks the page.
      setUploadError(error instanceof Error ? error.message : "Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {mediaUrl ? (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50 flex items-center justify-center">
          {/* Shared rule, not a local regex: this one missed .mov, and `includes('video')`
              would also match any path that merely contains the word. */}
          {isVideoMedia({ url: mediaUrl }) ? (
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
            /* A real percentage, so a slow upload reads as progress rather than a hang. */
            <div className="flex w-full flex-col items-center px-6">
              <span className="text-xs font-medium text-gray-600">Uploading… {progress}%</span>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-[#A83A22] transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="mt-1.5 text-[11px] text-gray-400">Large videos upload in parts — please keep this tab open</span>
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
      {uploadError && (
        <p className="mt-1.5 flex items-start justify-between gap-2 text-xs text-red-500">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="shrink-0 font-medium underline">
            Dismiss
          </button>
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
