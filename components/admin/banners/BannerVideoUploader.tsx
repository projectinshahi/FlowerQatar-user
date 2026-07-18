"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";

export default function BannerVideoUploader({
  value,
  onUploaded,
  onRemove,
}: {
  value?: string | null;
  onUploaded: (url: string, publicId: string) => void;
  onRemove?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Video must be under 100MB.");
      return;
    }
    try {
      setUploading(true);
      setProgress(0);
      const sigRes = await fetch("/api/admin/cloudinary/signature");
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig.error || "Failed to get upload signature");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", sig.timestamp.toString());
      fd.append("signature", sig.signature);
      fd.append("folder", "flower_products"); // must match the signed params

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const r = JSON.parse(xhr.responseText);
            onUploaded(r.secure_url, r.public_id);
            resolve();
          } else {
            let m = "Upload failed";
            try {
              m = JSON.parse(xhr.responseText)?.error?.message || m;
            } catch {
              /* ignore */
            }
            reject(new Error(m));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(fd);
      });
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black">
          <video src={value} controls className="w-full h-full object-contain" />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 text-gray-800 text-xs px-2.5 py-1 rounded-md hover:bg-white"
            >
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-md hover:bg-red-600 flex items-center gap-1"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 aspect-video transition-colors ${
            uploading ? "bg-gray-50 border-gray-300 cursor-not-allowed" : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center w-full max-w-xs">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600 font-medium">Uploading {progress}%</p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Click to upload a video</p>
              <p className="text-xs text-gray-500 mt-1">MP4, WEBM, MOV (Max 100MB)</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
