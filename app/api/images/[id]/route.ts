import { NextRequest, NextResponse } from 'next/server';
import { getImageById } from '@/lib/queries/images';

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

    // Redirect to R2 URL
    return NextResponse.redirect(image.r2Url, { status: 307 });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
