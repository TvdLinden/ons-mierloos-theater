import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const orderStatusVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
  {
    variants: {
      status: {
        paid: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        cancelled: 'bg-zinc-100 text-zinc-700',
        refunded: 'bg-sky-100 text-sky-800',
        refund_pending: 'bg-amber-100 text-amber-800',
      },
    },
    defaultVariants: {
      status: 'cancelled',
    },
  },
);

const dotVariants = cva('size-2 rounded-full', {
  variants: {
    status: {
      paid: 'bg-green-500',
      pending: 'bg-yellow-500',
      failed: 'bg-red-500',
      cancelled: 'bg-zinc-400',
      refunded: 'bg-sky-500',
      refund_pending: 'bg-amber-500',
    },
  },
  defaultVariants: {
    status: 'cancelled',
  },
});

const STATUS_LABELS: Record<string, string> = {
  paid: 'Betaald',
  pending: 'In behandeling',
  failed: 'Mislukt',
  cancelled: 'Geannuleerd',
  refunded: 'Terugbetaald',
  refund_pending: 'Terugbetaling in behandeling',
};

type OrderStatus = 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded' | 'refund_pending';

interface OrderStatusBadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export function OrderStatusBadge({ status, showDot = true, className }: OrderStatusBadgeProps) {
  const s = (status as OrderStatus) in STATUS_LABELS ? (status as OrderStatus) : 'cancelled';
  return (
    <span className={cn(orderStatusVariants({ status: s }), className)}>
      {showDot && <span className={dotVariants({ status: s })} />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const paymentStatusVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      status: {
        succeeded: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        cancelled: 'bg-zinc-100 text-zinc-700',
        processing: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  },
);

const PAYMENT_LABELS: Record<string, string> = {
  succeeded: 'Geslaagd',
  pending: 'In behandeling',
  failed: 'Mislukt',
  cancelled: 'Geannuleerd',
  processing: 'Verwerken',
};

type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'cancelled' | 'processing';

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const s = (status as PaymentStatus) in PAYMENT_LABELS ? (status as PaymentStatus) : 'pending';
  return (
    <span className={cn(paymentStatusVariants({ status: s }), className)}>
      {PAYMENT_LABELS[status] ?? status}
    </span>
  );
}
