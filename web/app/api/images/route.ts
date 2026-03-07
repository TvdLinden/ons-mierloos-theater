import { db } from '@ons-mierloos-theater/shared/db';
import { images } from '@ons-mierloos-theater/shared/db/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit')
      ? parseInt(request.nextUrl.searchParams.get('limit')!)
      : 1000;

    const imageList = await db.query.images.findMany({
      limit,
    });

    return NextResponse.json({
      images: imageList,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
