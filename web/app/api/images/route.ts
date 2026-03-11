import { db } from '@ons-mierloos-theater/shared/db';
import { images } from '@ons-mierloos-theater/shared/db/schema';
import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const limit = params.get('limit') ? parseInt(params.get('limit')!) : 48;
    const offset = params.get('offset') ? parseInt(params.get('offset')!) : 0;

    // Fetch one extra to determine if more pages exist
    const imageList = await db.query.images.findMany({
      limit: limit + 1,
      offset,
      orderBy: desc(images.uploadedAt),
    });

    const hasMore = imageList.length > limit;

    return NextResponse.json({
      images: hasMore ? imageList.slice(0, limit) : imageList,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
