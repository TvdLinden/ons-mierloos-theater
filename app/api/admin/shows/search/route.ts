import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shows, performances } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or, gte, lte, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const publicationFrom = searchParams.get('publicationFrom') || '';
  const publicationTo = searchParams.get('publicationTo') || '';
  const depublicationFrom = searchParams.get('depublicationFrom') || '';
  const depublicationTo = searchParams.get('depublicationTo') || '';
  const sortBy = searchParams.get('sortBy') || 'title';
  const sortDir = searchParams.get('sortDir') || 'asc';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(or(like(shows.title, `%${search}%`), like(shows.subtitle, `%${search}%`)));
  }

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    conditions.push(eq(shows.status, status as 'draft' | 'published' | 'archived'));
  }

  if (publicationFrom) {
    conditions.push(gte(shows.publicationDate, new Date(publicationFrom)));
  }

  if (publicationTo) {
    conditions.push(lte(shows.publicationDate, new Date(publicationTo)));
  }

  if (depublicationFrom) {
    conditions.push(gte(shows.depublicationDate, new Date(depublicationFrom)));
  }

  if (depublicationTo) {
    conditions.push(lte(shows.depublicationDate, new Date(depublicationTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get sort order
  const sortColumn =
    sortBy === 'title'
      ? shows.title
      : sortBy === 'publicationDate'
        ? shows.publicationDate
        : sortBy === 'depublicationDate'
          ? shows.depublicationDate
          : sortBy === 'basePrice'
            ? shows.basePrice
            : shows.title;

  const orderByClause = sortDir === 'desc' ? desc(sortColumn) : asc(sortColumn);

  // Count total
  const totalResult = await db.select({ total: count() }).from(shows).where(whereClause);
  const total = totalResult[0].total;

  // Fetch shows with pagination
  const result = await db.query.shows.findMany({
    where: whereClause,
    with: {
      image: true,
      performances: {
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
    orderBy: [orderByClause],
    offset,
    limit,
  });

  const data = result.map((show) => ({
    ...show,
    tags: show.showTags.map((st) => st.tag).filter(Boolean),
  }));

  return NextResponse.json({
    data,
    total,
    page: Math.floor(offset / limit),
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  });
}
