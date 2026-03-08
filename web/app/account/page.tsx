import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getUserOrders } from '@ons-mierloos-theater/shared/queries/orders';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/ui/order-status-badge';
import { ChevronRight, User, ShoppingBag, KeyRound } from 'lucide-react';
import { PaymentLink } from './PaymentLink';

export const metadata: Metadata = {
  title: 'Mijn Account - Ons Mierloos Theater',
  description: 'Beheer je account en bekijk je bestellingen',
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?redirectUrl=/account');
  }

  const orders = session.user.id ? await getUserOrders(session.user.id) : [];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mijn Account</h1>
          <p className="text-muted-foreground mt-1">Beheer je gegevens en bekijk je bestellingen</p>
        </div>

        {/* Profile card */}
        <Card className="border-0 shadow-sm bg-white mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted">
                <User className="size-4 text-muted-foreground" />
              </span>
              Profielinformatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Naam', value: session.user.name },
                { label: 'E-mailadres', value: session.user.email },
                { label: 'Rol', value: session.user.role },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                  <span className="font-medium text-sm capitalize">{value}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-4" />
            <div className="flex flex-wrap gap-3">
              <Link href="/account/edit">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="size-3.5" />
                  Profiel bewerken
                </Button>
              </Link>
              <Link href="/account/change-password">
                <Button variant="outline" size="sm" className="gap-2">
                  <KeyRound className="size-3.5" />
                  Wachtwoord wijzigen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted">
                <ShoppingBag className="size-4 text-muted-foreground" />
              </span>
              Bestelgeschiedenis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-12 px-6">
                <p className="text-muted-foreground mb-4">Je hebt nog geen bestellingen geplaatst.</p>
                <Link href="/">
                  <Button variant="outline" size="sm">Bekijk ons programma</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-sm">
                            Bestelling <span className="font-mono text-muted-foreground">#{order.id.substring(0, 8)}</span>
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt || '').toLocaleDateString('nl-NL', { dateStyle: 'long' })}
                          {' · '}
                          {order.lineItems.length === 1
                            ? order.lineItems[0].performance?.show?.title
                            : `${order.lineItems.length} voorstellingen`}
                        </p>

                        {order.status === 'pending' && order.payments?.[0]?.providerPaymentUrl && (
                          <PaymentLink href={order.payments[0].providerPaymentUrl} />
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold tabular-nums">€{order.totalAmount}</span>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
