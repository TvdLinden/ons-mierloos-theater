import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { db } from '@ons-mierloos-theater/shared/db';
import { orders, payments } from '@ons-mierloos-theater/shared/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  // Fetch order
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!order) {
    return NextResponse.json({ error: 'Bestelling niet gevonden' }, { status: 404 });
  }

  // Verify ownership: user must own the order (by userId or matching email)
  const isOwner = order.userId === session.user.id || order.customerEmail === session.user.email;

  if (!isOwner) {
    return NextResponse.json({ error: 'Geen toegang tot deze bestelling' }, { status: 403 });
  }

  // Only allow retry for pending orders
  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: `Bestelling heeft status "${order.status}" en kan niet opnieuw betaald worden` },
      { status: 400 },
    );
  }

  // Fetch the payment for this order
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, 'pending')))
    .limit(1);

  if (!payment || !payment.providerPaymentUrl) {
    return NextResponse.json(
      { error: 'Geen actieve betaling gevonden voor deze bestelling' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    paymentUrl: payment.providerPaymentUrl,
    orderId: order.id,
  });
}
