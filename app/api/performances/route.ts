import { db } from '@/lib/db';
import { performances } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const ids = idsParam.split(',').filter((id) => id.trim());

    if (ids.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const perfs = await db.query.performances.findMany({
      where: inArray(performances.id, ids),
      columns: {
        id: true,
        date: true,
        status: true,
        availableSeats: true,
      },
    });

    return new Response(JSON.stringify(perfs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching performances:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch performances' }), {
      status: 500,
    });
  }
}
