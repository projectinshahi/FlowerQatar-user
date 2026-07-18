// Client-side image helpers: crop (canvas), compress, and Cloudinary thumbnail URLs.

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Formats accepted for avatars. GIF/SVG/BMP/TIFF are intentionally excluded. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const radians = (deg: number) => (deg * Math.PI) / 180;

function rotatedSize(width: number, height: number, rotation: number) {
  const rad = radians(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = src;
  });
}

/** Crops (and optionally rotates) the source into a square JPEG blob. */
export async function getCroppedBlob(imageSrc: string, crop: CropArea, rotation = 0): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support image editing.");

  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation);
  canvas.width = bw;
  canvas.height = bh;

  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(radians(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(crop.x, crop.y, crop.width, crop.height);
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/jpeg", 0.92);
  });
}

/** Compresses a blob/file to a small, web-friendly JPEG. */
export async function compressImage(input: Blob): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  const file = input instanceof File ? input : new File([input], "avatar.jpg", { type: "image/jpeg" });
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}

/**
 * Derives a square, face-aware thumbnail URL from a stored Cloudinary original.
 * We store only the original URL; sizes are generated on-the-fly via transforms.
 */
export function cloudinaryThumb(url: string | null | undefined, size = 256): string | null {
  if (!url) return null;
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,g_face,w_${size},h_${size},q_auto,f_auto/`);
}
