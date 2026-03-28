'use client';

import { useCart } from '@/components/CartContext';
import ShoppingCart from '@/components/ShoppingCart';
import Link from 'next/link';
import Image from 'next/image';
import type { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShoppingBag } from 'lucide-react';

type CartPageClientProps = {
  recommendedShows: ShowWithTagsAndPerformances[];
};

function RecommendedShows({ shows }: { shows: ShowWithTagsAndPerformances[] }) {
  return (
    <div className="border border-border bg-white p-6 shadow-lg">
      <h2
        className="text-lg font-bold uppercase mb-5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Misschien ook interessant
      </h2>
      <div className="space-y-3">
        {shows.map((show) => (
          <Link key={show.id} href={`/voorstellingen/${show.slug}`} className="block group">
            <div className="border border-border overflow-hidden hover:bg-accent/50 transition-colors">
              {show.imageId && (
                <div className="relative h-36 w-full overflow-hidden">
                  <Image
                    src={getShowImageUrl(show, 'sm')}
                    alt={show.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    style={getFocalPointStyle(show.image?.focalPoints, '4:3')}
                  />
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-sm leading-snug line-clamp-2">{show.title}</p>
                {show.performances.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(show.performances[0].date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
                {show.basePrice && (
                  <p className="text-xs text-muted-foreground mt-1">vanaf €{show.basePrice}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CartPageClient({ recommendedShows }: CartPageClientProps) {
  const { items, removeFromCart, updateQuantity } = useCart();
  const isEmpty = items.length === 0;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      className="page-parchment min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: 'var(--color-parchment)' }}
    >
      <div className="bg-white h-8" />

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Terug naar voorstellingen
          </Button>
        </Link>

        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold uppercase leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Winkelwagen
          </h1>
          <p className="text-muted-foreground mt-2">Bekijk je geselecteerde tickets.</p>
        </div>

        {isEmpty ? (
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="lg:w-[65%] border border-border bg-white p-6 lg:p-8 shadow-lg">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-6">
                  <ShoppingBag className="size-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Je winkelwagen is leeg</h2>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  Voeg tickets toe vanuit ons programma om ze hier te zien.
                </p>
                <Link href="/">
                  <Button variant="maroon">Bekijk voorstellingen</Button>
                </Link>
              </div>
            </div>
            {recommendedShows.length > 0 && (
              <div className="lg:w-[35%]">
                <RecommendedShows shows={recommendedShows} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="lg:w-[65%] border border-border bg-white p-6 lg:p-8 shadow-lg">
              <h2
                className="text-lg font-bold uppercase mb-5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Bestelling
              </h2>

              <ShoppingCart
                items={items}
                onRemove={removeFromCart}
                onChangeQuantity={updateQuantity}
                showCheckoutButton={false}
                showTotal={false}
                showTitle={false}
                inputVariant="public"
              />

              <div className="mt-4 pt-4 border-t border-border flex justify-between text-base font-bold">
                <span>Totaal</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <div className="mt-6">
                <Link href="/checkout">
                  <Button variant="maroon" size="lg" className="w-full">
                    Naar afrekenen
                  </Button>
                </Link>
              </div>
            </div>

            {recommendedShows.length > 0 && (
              <div className="lg:w-[35%]">
                <RecommendedShows shows={recommendedShows} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
