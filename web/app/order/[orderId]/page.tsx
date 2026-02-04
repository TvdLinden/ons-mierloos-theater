import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderById } from '@ons-mierloos-theater/shared/queries/orders';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bestelling Status - Ons Mierloos Theater',
  description: 'Bekijk de status van je bestelling',
};

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { email?: string };
}) {
  const order = await getOrderById(params.orderId);

  if (!order) {
    notFound();
  }

  // Optional: verify email matches (extra security)
  if (
    searchParams.email &&
    order.customerEmail.toLowerCase() !== searchParams.email.toLowerCase()
  ) {
    notFound();
  }

  const payment = order.payments?.[0]; // Get latest payment

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-text-primary font-display">
        Bestelling #{order.id.substring(0, 8)}
      </h1>

      {/* Order Status Card */}
      <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Status</h2>
            <p className="text-sm text-text-secondary">
              Besteld op{' '}
              {new Date(order.createdAt || '').toLocaleDateString('nl-NL', {
                dateStyle: 'long',
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <p className="text-lg font-bold text-text-primary">Totaal: €{order.totalAmount}</p>
        </div>
      </div>

      {/* Payment Status - Pending with payment URL */}
      {order.status === 'pending' && payment?.providerPaymentUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-900">⏱️ Betaling vereist</h3>
          <p className="text-yellow-800 mb-4">
            Je plaatsen zijn gereserveerd. Voltooi je betaling om je bestelling te bevestigen.
          </p>
          <a
            href={payment.providerPaymentUrl}
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Betalen →
          </a>
        </div>
      )}

      {/* Payment Status - Pending without payment URL (being processed) */}
      {order.status === 'pending' && !payment?.providerPaymentUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">
            🔄 Betaallink wordt aangemaakt
          </h3>
          <p className="text-blue-800 mb-2">
            We maken je betaallink aan. Je ontvangt binnen 5 minuten een e-mail met de link.
          </p>
          <p className="text-sm text-blue-700">
            Controleer ook je spam/ongewenste e-mail map als je de e-mail niet ontvangt.
          </p>
        </div>
      )}

      {/* Payment Status - Paid */}
      {order.status === 'paid' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-green-900">✅ Betaling ontvangen</h3>
          <p className="text-green-800 mb-2">
            Je bestelling is bevestigd! Je ontvangt je tickets per e-mail.
          </p>
          <p className="text-sm text-green-700">
            Neem deze e-mail mee naar de voorstelling (digitaal of geprint).
          </p>
        </div>
      )}

      {/* Payment Status - Failed or Cancelled */}
      {(order.status === 'failed' || order.status === 'cancelled') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-red-900">❌ Bestelling geannuleerd</h3>
          <p className="text-red-800 mb-2">
            Deze bestelling is geannuleerd. De gereserveerde plaatsen zijn vrijgegeven.
          </p>
          <p className="text-sm text-red-700">
            Wil je toch tickets bestellen?{' '}
            <Link href="/" className="underline hover:no-underline">
              Bekijk ons programma
            </Link>
          </p>
        </div>
      )}

      {/* Payment Status - Refunded */}
      {order.status === 'refunded' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">💰 Betaling teruggestort</h3>
          <p className="text-blue-800">
            De betaling is teruggestort naar je rekening. Dit kan 3-5 werkdagen duren.
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Bestelgegevens</h2>

        <div className="space-y-3">
          <div>
            <span className="font-medium text-text-primary">Naam:</span>
            <span className="ml-2 text-text-secondary">{order.customerName}</span>
          </div>
          <div>
            <span className="font-medium text-text-primary">Email:</span>
            <span className="ml-2 text-text-secondary">{order.customerEmail}</span>
          </div>
        </div>

        {order.lineItems && order.lineItems.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-text-primary">Items:</h3>
            <div className="space-y-3">
              {order.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {item.performance?.show?.title || 'Voorstelling'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {item.performance?.date
                        ? new Date(item.performance.date).toLocaleString('nl-NL', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })
                        : ''}
                    </p>
                    <p className="text-sm text-text-secondary">{item.quantity}x tickets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">€{item.pricePerTicket} per ticket</p>
                    <p className="font-medium text-text-primary">
                      €{(parseFloat(item.pricePerTicket || '0') * (item.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {order.couponUsages && order.couponUsages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                {order.couponUsages.map((usage) => (
                  <div key={usage.id} className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">
                      🎟️ Kortingscode: {usage.coupon?.code}
                    </span>
                    <span className="text-green-600 font-medium">-€{usage.discountAmount}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t-2 border-border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-text-primary">Totaal:</span>
                <span className="text-lg font-bold text-primary">€{order.totalAmount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-surface rounded-lg shadow-md p-6 text-center">
        <p className="text-text-secondary text-sm mb-2">Vragen over je bestelling?</p>
        <a
          href="mailto:info@onsmierloostheater.nl"
          className="text-primary hover:underline font-medium"
        >
          Neem contact op via e-mail
        </a>
        <p className="text-text-secondary text-sm mt-4">
          <Link href="/" className="text-primary hover:underline">
            ← Terug naar homepage
          </Link>
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-blue-100 text-blue-800',
  };

  const labels = {
    paid: 'Betaald',
    pending: 'Wacht op betaling',
    failed: 'Mislukt',
    cancelled: 'Geannuleerd',
    refunded: 'Terugbetaald',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.cancelled}`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
