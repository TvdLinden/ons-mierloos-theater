import sharp from 'sharp';

export interface ImageVariants {
  lg: Buffer;
  md: Buffer;
  sm: Buffer;
}

export async function generateImageVariants(buffer: Buffer): Promise<ImageVariants> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Determine if image needs rotation based on EXIF orientation
  const rotatedImage = image.rotate();

  // Generate large variant (1200px width, maintain aspect ratio)
  const lg = await rotatedImage
    .clone()
    .resize(1200, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  // Generate medium variant (600px width)
  const md = await rotatedImage
    .clone()
    .resize(600, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  // Generate small variant (300px width)
  const sm = await rotatedImage
    .clone()
    .resize(300, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 75, progressive: true })
    .toBuffer();

  return { lg, md, sm };
}

export type ImageSize = 'lg' | 'md' | 'sm';

export function getImageSizeFromBreakpoint(width?: number): ImageSize {
  if (!width) return 'lg';
  if (width < 640) return 'sm';
  if (width < 1024) return 'md';
  return 'lg';
}
