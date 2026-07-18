"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { RotateCw, ZoomIn, Loader2, X } from "lucide-react";
import { getCroppedBlob, compressImage, type CropArea } from "../../lib/image";
import { errMsg } from "../../lib/error";

/**
 * Square-crop dialog. Zoom / rotate / drag with a live preview; only on "Apply"
 * does it produce a compressed JPEG blob for upload.
 */
export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => setPixels(areaPixels), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, processing]);

  const apply = async () => {
    if (!pixels || processing) return;
    setError(null);
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels, rotation);
      const file = await compressImage(blob);
      onConfirm(file);
    } catch (e) {
      setError(errMsg(e, "Could not process the image."));
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Crop your photo">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={processing ? undefined : onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEE]">
          <h3 className="font-serif text-[18px] text-primary">Adjust your photo</h3>
          <button type="button" onClick={onCancel} disabled={processing} className="text-[#999] hover:text-primary disabled:opacity-50" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="relative w-full h-72 bg-[#1c1c1c]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="flex items-center gap-3 text-[12px] text-[#666]">
            <ZoomIn size={16} className="text-[#999] shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Zoom"
            />
          </label>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.1em] text-[#666] hover:text-primary"
          >
            <RotateCw size={15} /> Rotate
          </button>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#EEE]">
          <button
            type="button"
            onClick={apply}
            disabled={processing || !pixels}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors disabled:bg-gray-300"
          >
            {processing && <Loader2 size={14} className="animate-spin" />}
            {processing ? "Processing…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#666] hover:text-primary disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
