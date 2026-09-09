/**
 * Chunk boundaries for a Cloudinary chunked upload.
 *
 * Kept separate from the uploader because the arithmetic is the part that fails silently: an
 * off-by-one in `Content-Range` does not error, it assembles a corrupt asset on Cloudinary's
 * side. `end` is INCLUSIVE in the header (`bytes 0-6291455/11080357`) while Blob.slice's end is
 * exclusive, and mixing the two is the easy mistake.
 */
export interface UploadChunk {
  /** Byte offset of the first byte, and the exclusive end for Blob.slice(start, sliceEnd). */
  start: number;
  sliceEnd: number;
  /** Ready-to-send header value, whose end offset is inclusive. */
  contentRange: string;
}

export function planChunks(size: number, chunkBytes: number): UploadChunk[] {
  if (size <= 0) return [];
  if (chunkBytes <= 0) throw new Error('chunkBytes must be positive');
  const chunks: UploadChunk[] = [];
  for (let start = 0; start < size; start += chunkBytes) {
    const sliceEnd = Math.min(start + chunkBytes, size);
    chunks.push({ start, sliceEnd, contentRange: `bytes ${start}-${sliceEnd - 1}/${size}` });
  }
  return chunks;
}
