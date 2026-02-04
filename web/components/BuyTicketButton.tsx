'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { Button } from '@/components/ui';
import { NumberInput } from './ui/number-input';

export type BuyTicketButtonProps = {
  performanceId: string;
  performanceTitle: string | null;
  price: string | null;
};

export default function BuyTicketButton({
  performanceId,
  performanceTitle,
  price,
}: BuyTicketButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!price || !performanceTitle) return;

    addToCart({
      id: performanceId,
      title: performanceTitle,
      price: parseFloat(price),
      quantity,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleGoToCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-4">
        <label htmlFor="quantity" className="text-primary font-medium">
          Aantal:
        </label>
        <NumberInput
          id="quantity"
          min={1}
          max={10}
          value={quantity}
          onChange={(value) => setQuantity(Math.max(1, value || 1))}
          className="w-20 px-3 py-2 border border-primary rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>

      {showSuccess && (
        <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-medium">
          ✓ Toegevoegd aan winkelwagen
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          onClick={handleAddToCart}
          disabled={!price}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          {price ? 'Toevoegen aan Winkelwagen' : 'Niet beschikbaar'}
        </Button>
        <Button onClick={handleGoToCheckout} variant="default" size="lg" className="flex-1">
          Naar Afrekenen →
        </Button>
      </div>
    </div>
  );
}
