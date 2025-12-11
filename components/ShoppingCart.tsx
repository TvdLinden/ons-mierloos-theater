import React from 'react';
import Link from 'next/link';
import { NumberInput } from './ui/number-input';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

export type ShoppingCartProps = {
  items: CartItem[];
  onRemove?: (id: string) => void;
  onChangeQuantity?: (id: string, quantity: number) => void;
  showCheckoutButton?: boolean;
  showTotal?: boolean;
  showTitle?: boolean;
};

export default function ShoppingCart({
  items,
  onRemove,
  onChangeQuantity,
  showCheckoutButton = true,
  showTotal = true,
  showTitle = true,
}: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="bg-gray-50 rounded-lg p-6 w-full">
      {showTitle && <h2 className="text-2xl font-bold mb-4 text-primary">Winkelwagen</h2>}
      {items.length === 0 ? (
        <p className="text-gray-500">Je winkelwagen is leeg.</p>
      ) : (
        <ul className="divide-y divide-gray-200 mb-4">
          {items.map((item) => (
            <li key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{item.title}</span>
                <span className="ml-2 text-gray-600">€{item.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={item.quantity}
                  onChange={(value) => onChangeQuantity && onChangeQuantity(item.id, value ?? 1)}
                  min={1}
                />
                {onRemove && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Verwijder
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {showTotal && (
        <div className="text-lg font-bold text-right mb-2 text-gray-900">
          Totaal: €{total.toFixed(2)}
        </div>
      )}
      {showCheckoutButton && (
        <Link
          href="/checkout"
          className="block w-full px-6 py-3 bg-primary text-surface rounded font-bold hover:bg-secondary text-center disabled:opacity-50"
        >
          Naar afrekenen
        </Link>
      )}
    </div>
  );
}
