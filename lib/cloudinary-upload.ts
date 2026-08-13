import imageCompression from 'browser-image-compression';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Browser-side signed upload to the project's existing Cloudinary account.
 * Compresses first, then uploads with the short-lived signature from
 * /api/admin/cloudinary/signature — the secret never reaches the client.
 *
 * Returns the secure URL. Throws with a message safe to show in a toast.
 */
export async function uploadToCloudinary(
  source: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!ALLOWED.includes(source.type)) throw new Error('Use a JPG, JPEG, PNG, or WEBP image');
  if (source.size > MAX_BYTES) throw new Error('Image must be 5 MB or smaller');

  const file = await imageCompression(source, {
    maxSizeMB: 4.5,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    fileType: source.type,
  });

  const signature = await fetch('/api/admin/cloudinary/signature');
  if (!signature.ok) throw new Error('Unable to prepare upload');
  const { apiKey, cloudName, timestamp, signature: sig } = await signature.json();

  const data = new FormData();
  data.append('file', file);
  data.append('api_key', apiKey);
  data.append('timestamp', String(timestamp));
  data.append('signature', sig);
  data.append('folder', 'flower_products');

  const { secure_url } = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(JSON.parse(xhr.responseText))
        : reject(new Error('Upload failed'));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(data);
  });

  return secure_url;
}
