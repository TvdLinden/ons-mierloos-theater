import { NextRequest, NextResponse } from 'next/server';
import { db } from '@ons-mierloos-theater/shared/db';
import { orders } from '@ons-mierloos-theater/shared/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { validateClientToken, hasScope } from '@/lib/auth/client-credentials';

const APP_ID = process.env.APP_ID || 'self';

export async function POST(request: NextRequest) {
  try {
    const token = await validateClientToken(request);
    if (token) {
      if (!hasScope(token, APP_ID, 'sync:orders')) {
        return NextResponse.json(
          { error: 'Forbidden', error_description: 'Missing required scope: sync:orders' },
          { status: 403 },
        );
      }
    } else {
      // If no token, reject (we don't support legacy secret for orders sync)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = {
      total: 0,
      checked: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Fetch orders that are pending (note: "processing" is not a valid status in the schema)
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.status, ['pending']));
    result.total = pendingOrders.length;

    // For now we don't call an external service; this endpoint acts as a placeholder
    // to surface pending orders so operators can inspect or extend with real sync logic.
    for (const o of pendingOrders) {
      try {
        result.checked++;

        if (o.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, o.id));
          result.updated++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Order ${o.id}: ${msg}`);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Order sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'invalid_request', error_description: 'Use POST to run order sync' },
    { status: 405 },
  );
}
