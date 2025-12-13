import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/lib/queries/images';
import type { ImageSize } from '@/lib/utils/imageProcessor';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  // Get size parameter from query string (default to 'lg')
  const { searchParams } = new URL(request.url);
  const size = (searchParams.get('size') || 'lg') as ImageSize;

  // Validate size parameter
  if (!['lg', 'md', 'sm'].includes(size)) {
    return NextResponse.json(
      { error: 'Invalid size parameter. Use: lg, md, or sm' },
      { status: 400 },
    );
  }

  try {
    const image = await getImageById(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Select the appropriate variant based on size parameter
    // Fall back to old 'data' column if variants don't exist yet (during migration)
    let imageData: Buffer<ArrayBuffer> | null = null;
    switch (size) {
      case 'lg':
        imageData = image.imageLg ? Buffer.from(image.imageLg) : null;
        break;
      case 'md':
        imageData = image.imageMd ? Buffer.from(image.imageMd) : null;
        break;
      case 'sm':
        imageData = image.imageSm ? Buffer.from(image.imageSm) : null;
        break;
    }

    if (!imageData) {
      return NextResponse.json({ error: 'Image variant not found' }, { status: 404 });
    }

    // Return image with proper headers
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': image.mimetype || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${image.filename || 'image'}"`,
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
