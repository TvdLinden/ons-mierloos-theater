import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getUserOrders } from '@/lib/queries/orders';
import Link from 'next/link';

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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary font-display">Mijn Account</h1>

      {/* User Info Card */}
      <div className="bg-surface rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Profielinformatie</h2>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-text-primary">Naam:</span>
            <span className="ml-2 text-text-secondary">{session.user.name}</span>
          </div>
          <div>
            <span className="font-medium text-text-primary">Email:</span>
            <span className="ml-2 text-text-secondary">{session.user.email}</span>
          </div>
          <div>
            <span className="font-medium text-text-primary">Rol:</span>
            <span className="ml-2 text-text-secondary capitalize">{session.user.role}</span>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <Link
            href="/account/edit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Profiel bewerken
          </Link>
          <Link
            href="/account/change-password"
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Wachtwoord wijzigen
          </Link>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-surface rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Bestelgeschiedenis</h2>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">Je hebt nog geen bestellingen geplaatst.</p>
            <Link href="/" className="text-primary hover:underline">
              Bekijk ons programma →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-text-primary">
                      Bestelling #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {new Date(order.createdAt || '').toLocaleDateString('nl-NL', {
                        dateStyle: 'long',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">€{order.totalAmount}</p>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800'
                              : order.status === 'refunded'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.status === 'paid'
                        ? 'Betaald'
                        : order.status === 'pending'
                          ? 'In behandeling'
                          : order.status === 'cancelled'
                            ? 'Geannuleerd'
                            : order.status === 'refunded'
                              ? 'Terugbetaald'
                              : 'Mislukt'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm border-t border-border pt-2"
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {item.performance?.show?.title || 'Voorstelling'}
                        </p>
                        {item.performance?.date && (
                          <p className="text-text-secondary">
                            {new Date(item.performance.date).toLocaleString('nl-NL', {
                              dateStyle: 'long',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-text-primary">
                          {item.quantity}x €{item.pricePerTicket}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
