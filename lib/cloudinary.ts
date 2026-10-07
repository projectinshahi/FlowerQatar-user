import crypto from 'crypto';

/**
 * Builds a signed set of params the browser can use to upload directly to Cloudinary.
 * The client MUST send the SAME `folder` (and `allowed_formats`, when given) or Cloudinary
 * rejects the signature — which is what stops a signed-in user uploading arbitrary file types.
 */
export function signUpload(folder: string, allowedFormats?: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials missing');
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Cloudinary signs the params sorted by name: allowed_formats < folder < timestamp.
  const signed = allowedFormats ? `allowed_formats=${allowedFormats}&` : '';
  const stringToSign = `${signed}folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  return { timestamp, signature, apiKey, cloudName, folder, allowedFormats };
}

export async function deleteCloudinaryImage(publicId: string, resourceType: 'image' | 'video' = 'image') {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials missing');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}
