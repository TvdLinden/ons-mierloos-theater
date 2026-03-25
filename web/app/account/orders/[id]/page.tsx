'use server';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getOrderById } from '@ons-mierloos-theater/shared/queries/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Metadata } from 'next';
import {
  AlertCircle,
  ChevronLeft,
  Download,
  Ticket,
  Receipt,
  CalendarDays,
  User,
} from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/order-status-badge';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Bestelling ${id.substring(0, 8)} - Ons Mierloos Theater`,
    description: 'Bekijk de details van je bestelling',
  };
}

export default async function UserOrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?redirectUrl=/account');
  }

  const { id: orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) notFound();
  if (order.userId !== session.user.id) notFound();

  const isPaid = order.status === 'paid';

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Back nav */}
        <Link href="/account">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Terug naar account
          </Button>
        </Link>

        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {new Date(order.createdAt || '').toLocaleDateString('nl-NL', { dateStyle: 'long' })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bestelling{' '}
              <span className="font-mono text-muted-foreground">#{order.id.substring(0, 8)}</span>
            </h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Pending payment alert */}
        {order.status === 'pending' && order.payments?.[0]?.providerPaymentUrl && (
          <Alert className="mb-8 border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Betaling nog niet ontvangen</AlertTitle>
            <AlertDescription className="mt-2 text-amber-700">
              <p className="mb-4">
                Je betaling is nog niet verwerkt. Klik hieronder om je betaling af te ronden.
              </p>
              <a href={order.payments[0].providerPaymentUrl}>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  Betaling voltooien →
                </Button>
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Totaalbedrag</p>
              <p className="text-2xl font-bold">€{order.totalAmount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Tickets</p>
              <p className="text-2xl font-bold">
                {order.lineItems.flatMap((li) => li.tickets ?? []).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer info */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex items-center justify-center size-7 rounded-lg bg-[#2d4059]/10">
                  <User className="size-4 text-[#2d4059]" />
                </span>
                Bestellinggegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Naam', value: order.customerName },
                { label: 'E-mailadres', value: order.customerEmail },
                {
                  label: 'Besteldatum',
                  value: order.createdAt
                    ? new Date(order.createdAt).toLocaleString('nl-NL', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })
                    : '-',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="font-medium text-sm mt-0.5">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Price summary */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex items-center justify-center size-7 rounded-lg bg-[#00a098]/10">
                  <Receipt className="size-4 text-[#00a098]" />
                </span>
                Samenvatting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 pb-3 mb-3 border-b border-dashed">
                {order.lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}× {item.performance?.show?.title || 'Voorstelling'}
                    </span>
                    <span className="font-medium tabular-nums">
                      €{(Number(item.pricePerTicket) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {order.couponUsages && order.couponUsages.length > 0 && (
                <div className="mb-3 pb-3 border-b border-dashed">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Kortingscodes
                  </p>
                  {order.couponUsages.map((usage) => (
                    <div key={usage.id} className="flex justify-between text-sm">
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {usage.coupon?.code}
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        −€{usage.discountAmount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold">Totaal</span>
                <span className="text-2xl font-bold text-[#00a098] tabular-nums">
                  €{order.totalAmount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets table */}
        <Card className="mb-6 border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-[#00a098]/10">
                <Ticket className="size-4 text-[#00a098]" />
              </span>
              Tickets
            </CardTitle>
            {isPaid && (
              <a href={`/api/orders/${order.id}/invoice/`}>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Factuur
                </Button>
              </a>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-6 text-xs">Ticketnummer</TableHead>
                  <TableHead className="text-xs">Voorstelling</TableHead>
                  <TableHead className="text-xs">Datum & Tijd</TableHead>
                  <TableHead className="text-center text-xs">Rij</TableHead>
                  <TableHead className="text-center text-xs">Stoel</TableHead>
                  {isPaid && <TableHead className="text-right pr-6 text-xs">Download</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.lineItems.flatMap((item) => item.tickets ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isPaid ? 6 : 5}
                      className="text-center text-muted-foreground py-12"
                    >
                      {isPaid
                        ? 'Geen tickets gevonden in deze bestelling.'
                        : 'Tickets worden beschikbaar na bevestiging van je betaling.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  order.lineItems.flatMap((item) =>
                    (item.tickets ?? []).map((ticket) => (
                      <TableRow key={ticket.id} className="group">
                        <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.performance?.show?.title || 'Onbekende voorstelling'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.performance?.date
                            ? new Date(item.performance.date).toLocaleString('nl-NL', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center size-7 rounded-md bg-muted text-sm font-semibold">
                            {ticket.rowNumber}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center size-7 rounded-md bg-[#00a098]/10 text-[#00a098] text-sm font-semibold">
                            {ticket.seatNumber}
                          </span>
                        </TableCell>
                        {isPaid && (
                          <TableCell className="text-right pr-6">
                            <a href={`/api/tickets/${ticket.id}/download/`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 hover:bg-[#00a098]/10 hover:text-[#00a098]"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </TableCell>
                        )}
                      </TableRow>
                    )),
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment info */}
        {order.payments && order.payments.length > 0 && (
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex items-center justify-center size-7 rounded-lg bg-[#2d4059]/10">
                  <CalendarDays className="size-4 text-[#2d4059]" />
                </span>
                Betalingsinformatie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-6 text-xs">Methode</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Bedrag</TableHead>
                    <TableHead className="text-right pr-6 text-xs">Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="pl-6 capitalize font-medium">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        €{payment.amount}
                      </TableCell>
                      <TableCell className="text-right pr-6 text-sm text-muted-foreground">
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleString('nl-NL', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <Link href="/account">
            <Button variant="ghost" className="-ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Terug naar account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
