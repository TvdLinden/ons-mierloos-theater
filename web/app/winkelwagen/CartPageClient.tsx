'use client';

import { useCart } from '@/components/CartContext';
import ShoppingCart from '@/components/ShoppingCart';
import Link from 'next/link';
import Image from 'next/image';
import type { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Card/CardContent used for empty state only
import { ChevronLeft, ShoppingBag } from 'lucide-react';

type CartPageClientProps = {
  recommendedShows: ShowWithTagsAndPerformances[];
};

function RecommendedShows({ shows }: { shows: ShowWithTagsAndPerformances[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-1">
        Misschien ook interessant
      </h3>
      {shows.map((show) => (
        <Link key={show.id} href={`/voorstellingen/${show.slug}`} className="block group">
          <div className="rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors overflow-hidden">
            {show.imageId && (
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  src={getShowImageUrl(show, 'sm')}
                  alt={show.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
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
  );
}

export function CartPageClient({ recommendedShows }: CartPageClientProps) {
  const { items, removeFromCart, updateQuantity } = useCart();
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-5xl mx-auto px-4">
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Winkelwagen</h1>
        </div>

        {isEmpty ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-6">
                    <ShoppingBag className="size-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Je winkelwagen is leeg</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    Voeg tickets toe vanuit ons programma om ze hier te zien.
                  </p>
                  <Link href="/">
                    <Button>Bekijk voorstellingen</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              {recommendedShows.length > 0 && <RecommendedShows shows={recommendedShows} />}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ShoppingCart
                items={items}
                onRemove={removeFromCart}
                onChangeQuantity={updateQuantity}
                showCheckoutButton={true}
                showTotal={true}
                showTitle={false}
              />
            </div>

            <div className="lg:col-span-1">
              {recommendedShows.length > 0 && <RecommendedShows shows={recommendedShows} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
