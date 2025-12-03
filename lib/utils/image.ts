import sharp from 'sharp';
import { readFile } from 'fs/promises';

export async function readFormFile(file: File): Promise<Buffer> {
  const buffer = await file.arrayBuffer().then((ab) => Buffer.from(ab));
  return buffer;
}

export async function createThumbnail(
  imageBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  // Use sharp to resize
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(width, height, { fit: 'inside' })
    .toBuffer();

  return thumbnailBuffer;
}

export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}`;
}
