"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Trash2, Check, AlertCircle } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, cloudinaryThumb } from "../../lib/image";
import { errMsg } from "../../lib/error";

// Lazy-load the heavy modal/cropper bundles — only when actually opened.
const AvatarCropModal = dynamic(() => import("./AvatarCropModal"), { ssr: false });
const AvatarPreviewModal = dynamic(() => import("./AvatarPreviewModal"), { ssr: false });

export default function ProfileImageUploader({
  value,
  onChange,
  initials,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  initials: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const pickFile = () => {
    if (uploading || disabled) return;
    inputRef.current?.click();
  };

  const onFile = (file: File) => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const upload = async (file: File) => {
    if (uploading) return; // prevent duplicate uploads
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const sigRes = await fetch("/api/cloudinary/signature");
      const sig = await sigRes.json();
      if (!sigRes.ok || !sig?.success) throw new Error(sig?.error || "Upload not authorized");
      const { timestamp, signature, apiKey, cloudName, folder, allowedFormats } = sig.data;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);
      if (allowedFormats) fd.append("allowed_formats", allowedFormats);

      const url: string = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
          else {
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

      onChange(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1800);
    } catch (e) {
      setError(errMsg(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const thumb = cloudinaryThumb(value, 256);

  return (
    <div className="flex items-center gap-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      {/* Avatar */}
      <button
        type="button"
        onClick={() => (value ? setPreview(true) : pickFile())}
        className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#EFE9E1] to-[#E3DACB] border border-[#E4DDD0] flex items-center justify-center shrink-0 group focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label={value ? "View profile photo" : "Add profile photo"}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-[26px] text-[#8A7F6C] tracking-wide">{initials}</span>
        )}

        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>

        {uploading && (
          <span className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2 size={20} className="text-white animate-spin" />
            <span className="text-white text-[10px] mt-1">{progress}%</span>
          </span>
        )}
        <AnimatePresence>
          {success && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-green-600/90 flex items-center justify-center"
            >
              <Check size={26} className="text-white" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Actions */}
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pickFile}
            disabled={uploading || disabled}
            className="inline-flex items-center gap-2 border border-black px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            <Camera size={14} />
            {value ? "Change" : "Upload"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#999] mt-2">JPG, PNG or WEBP · up to 5MB.</p>
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {cropSrc && (
          <AvatarCropModal
            imageSrc={cropSrc}
            onCancel={() => setCropSrc(null)}
            onConfirm={(file) => {
              setCropSrc(null);
              upload(file);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{preview && value && <AvatarPreviewModal src={value} onClose={() => setPreview(false)} />}</AnimatePresence>

      {/* Remove confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Remove profile picture">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmRemove(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center"
            >
              <Trash2 className="mx-auto mb-3 text-red-400" />
              <p className="font-serif text-[18px] text-primary mb-1">Remove profile picture?</p>
              <p className="text-[13px] text-[#888] mb-6">Are you sure you want to remove your profile picture?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setConfirmRemove(false);
                  }}
                  className="bg-red-500 text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
                <button type="button" onClick={() => setConfirmRemove(false)} className="px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#666] hover:text-primary">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
