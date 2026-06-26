'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

// Cast Image to bypass React 19 TypeScript namespace discrepancy on next/image
const NextImage = Image as any;

export default function LuxuryImage(props: ImageProps) {
  return <NextImage {...props} />;
}
