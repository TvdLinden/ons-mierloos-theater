import { getShowBySlugWithTagsAndPerformances } from '@/lib/queries/shows';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const show = await getShowBySlugWithTagsAndPerformances(slug);

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    return NextResponse.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
