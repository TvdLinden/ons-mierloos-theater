'use client';

import { useCart } from '@/components/CartContext';
import ShoppingCart from '@/components/ShoppingCart';
import Link from 'next/link';
import Image from 'next/image';
import type { ShowWithTagsAndPerformances } from '@/lib/db';
import { getImageUrl } from '@/lib/utils/image-url';
import { getShowImageUrl } from '@/lib/utils/performanceImages';

type CartPageClientProps = {
  recommendedShows: ShowWithTagsAndPerformances[];
};

export function CartPageClient({ recommendedShows }: CartPageClientProps) {
  const { items, removeFromCart, updateQuantity } = useCart();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary hover:text-secondary transition-colors inline-flex items-center gap-2 mb-4"
          >
            <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Terug naar voorstellingen
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ShoppingCart
              items={items}
              onRemove={removeFromCart}
              onChangeQuantity={updateQuantity}
              showCheckoutButton={true}
              showTotal={true}
              showTitle={true}
            />

            {items.length === 0 && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-6">Je hebt nog geen tickets in je winkelwagen.</p>
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-colors"
                >
                  Bekijk voorstellingen
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-primary mb-4">Misschien ook interessant?</h3>

              {recommendedShows.length > 0 ? (
                <div className="space-y-4">
                  {recommendedShows.map((show) => (
                    <Link key={show.id} href={`/${show.slug}`} className="block group">
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {show.imageId && (
                          <div className="relative h-32 w-full">
                            <Image
                              src={getShowImageUrl(show, 'sm')}
                              alt={show.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                            {show.title}
                          </h4>
                          {show.performances.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(show.performances[0].date).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Ontdek meer voorstellingen in Ons Mierloos Theater
                </p>
              )}

              <Link
                href="/"
                className="block w-full mt-4 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors text-center"
              >
                Alle voorstellingen
              </Link>
            </div>

            <div className="bg-secondary/10 rounded-lg p-6">
              <h4 className="font-bold text-gray-900 mb-2">💡 Tip</h4>
              <p className="text-sm text-gray-700">
                Houd onze website in de gaten voor nieuwe voorstellingen en speciale evenementen!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
