import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/lib/queries/images';
import { getImageFromR2 } from '@/lib/utils/r2ImageStorage';

/**
 * Phase 6: R2-only image serving
 * After migration to R2, all images are served directly from R2
 * This endpoint acts as a redirect to the R2 URL for backward compatibility
 * @deprecated Prefer direct R2 URLs from Image objects instead of API redirect
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  try {
    const image = await getImageById(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (!image.r2Url) {
      return NextResponse.json({ error: 'Image URL not found' }, { status: 404 });
    }

    // Stream the image from R2 using authenticated client
    const r2File = await getImageFromR2(image.r2Url);

    // Set headers for public asset caching and content type (optionally add more headers as needed)
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Content-Type', r2File.contentType || 'image/jpeg'); // Optionally detect type dynamically

    return new NextResponse(r2File.stream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
