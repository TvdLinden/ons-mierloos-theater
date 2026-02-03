import React from 'react';
import Link from 'next/link';
import { NumberInput } from './ui/number-input';
import { isCartItemExpired } from '@/lib/utils/validation';

export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  performanceDate?: Date;
  addedAt?: Date;
  wheelchairAccess?: boolean;
};

export type ShoppingCartProps = {
  items: CartItem[];
  onRemove?: (id: string) => void;
  onChangeQuantity?: (id: string, quantity: number) => void;
  onChangeWheelchairAccess?: (id: string, value: boolean) => void;
  showCheckoutButton?: boolean;
  showTotal?: boolean;
  showTitle?: boolean;
};

export default function ShoppingCart({
  items,
  onRemove,
  onChangeQuantity,
  onChangeWheelchairAccess,
  showCheckoutButton = true,
  showTotal = true,
  showTitle = true,
}: ShoppingCartProps) {
  // Separate valid and expired items
  const validItems = items.filter((item) => {
    if (!item.performanceDate) return true; // Allow items without date for backward compatibility
    return !isCartItemExpired(item);
  });

  const expiredItems = items.filter((item) => {
    if (!item.performanceDate) return false;
    return isCartItemExpired(item);
  });

  const total = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isCheckoutDisabled = items.length > 0 && validItems.length === 0;

  return (
    <div className="bg-gray-50 rounded-lg p-6 w-full">
      {showTitle && <h2 className="text-2xl font-bold mb-4 text-primary">Winkelwagen</h2>}

      {/* Show warning for expired items */}
      {expiredItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-red-900">Niet meer beschikbare items</h3>
          <p className="text-red-800 text-sm mt-1">
            {expiredItems.length} item{expiredItems.length > 1 ? 's' : ''} in je winkelwagen{' '}
            {expiredItems.length > 1 ? 'zijn' : 'is'} niet meer beschikbaar (de voorstelling is al
            geweest).
          </p>
          {expiredItems.length > 0 && (
            <ul className="mt-2 text-sm text-red-700">
              {expiredItems.map((item) => (
                <li key={item.id}>• {item.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {validItems.length === 0 ? (
        <p className="text-gray-500">Je winkelwagen is leeg.</p>
      ) : (
        <ul className="divide-y divide-gray-200 mb-4">
          {validItems.map((item) => (
            <li key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{item.title}</span>
                <span className="ml-2 text-gray-600">€{item.price.toFixed(2)}</span>
                {onChangeWheelchairAccess && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id={`wheelchair-${item.id}`}
                      checked={item.wheelchairAccess || false}
                      onChange={(e) => onChangeWheelchairAccess(item.id, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label
                      htmlFor={`wheelchair-${item.id}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Ik heb een rolstoel nodig
                    </label>
                  </div>
                )}
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
      {showTotal && validItems.length > 0 && (
        <div className="text-lg font-bold text-right mb-2 text-gray-900">
          Totaal: €{total.toFixed(2)}
        </div>
      )}
      {showCheckoutButton && (
        <Link
          href="/checkout"
          className={`block w-full px-6 py-3 rounded font-bold text-center transition-colors ${
            isCheckoutDisabled
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50'
              : 'bg-primary text-surface hover:bg-secondary'
          }`}
          onClick={(e) => isCheckoutDisabled && e.preventDefault()}
        >
          {isCheckoutDisabled ? 'Voeg geldige items toe' : 'Naar afrekenen'}
        </Link>
      )}
    </div>
  );
}
