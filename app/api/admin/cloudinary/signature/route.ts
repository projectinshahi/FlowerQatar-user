import { NextResponse } from 'next/server';
import crypto from 'crypto';
// Force Turbopack cache refresh

export async function GET() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET as string;
    const apiKey = process.env.CLOUDINARY_API_KEY as string;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!apiSecret || !apiKey || !cloudName) {
      throw new Error('Missing Cloudinary credentials in .env');
    }

    const stringToSign = `folder=flower_products&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return NextResponse.json({ timestamp, signature, apiKey, cloudName });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
