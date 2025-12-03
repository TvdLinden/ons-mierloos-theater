import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/lib/queries/images';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  try {
    const image = await getImageById(id);

    if (!image || !image.data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Return image with proper headers
    return new NextResponse(Buffer.from(image.data), {
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
