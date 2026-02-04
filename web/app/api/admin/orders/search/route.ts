import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/utils/auth';
import { getFilteredOrders } from '@ons-mierloos-theater/shared/queries/orders-advanced';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    await requireRole(['admin', 'contributor']);

    const searchParams = request.nextUrl.searchParams;

    // Extract filter params
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const sortBy =
      (searchParams.get('sortBy') as 'createdAt' | 'customerName' | 'totalAmount') || 'createdAt';
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Fetch filtered orders
    const result = await getFilteredOrders({
      search,
      fromDate,
      toDate,
      status,
      sortBy,
      sortDir,
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching filtered orders:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
