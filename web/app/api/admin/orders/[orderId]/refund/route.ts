import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/utils/auth';
import { createMollieRefund } from '@ons-mierloos-theater/shared/commands/payments';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await params;

  let body: { amount?: string; ticketIdsToCancel?: string[]; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { amount, ticketIdsToCancel = [], description } = body;

  if (!amount || !/^\d+\.\d{2}$/.test(amount) || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const result = await createMollieRefund(orderId, amount, ticketIdsToCancel, description);

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
