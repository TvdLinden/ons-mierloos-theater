import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { NumberInput } from './ui/number-input';
import { isCartItemExpired } from '@ons-mierloos-theater/shared/utils/validation';

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
  inputVariant?: 'default' | 'public';
};

export default function ShoppingCart({
  items,
  onRemove,
  onChangeQuantity,
  onChangeWheelchairAccess,
  showCheckoutButton = true,
  showTotal = true,
  showTitle = true,
  inputVariant = 'default',
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
    <div className="bg-muted/50 rounded-lg p-6 w-full">
      {showTitle && <h2 className="text-2xl font-bold mb-4 text-primary">Winkelwagen</h2>}

      {/* Show warning for expired items */}
      {expiredItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-4 mb-4">
          <h3 className="font-semibold text-destructive">Niet meer beschikbare items</h3>
          <p className="text-destructive/80 text-sm mt-1">
            {expiredItems.length} item{expiredItems.length > 1 ? 's' : ''} in je winkelwagen{' '}
            {expiredItems.length > 1 ? 'zijn' : 'is'} niet meer beschikbaar (de voorstelling is al
            geweest).
          </p>
          {expiredItems.length > 0 && (
            <ul className="mt-2 text-sm text-destructive/70">
              {expiredItems.map((item) => (
                <li key={item.id}>• {item.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {validItems.length === 0 ? (
        <p className="text-muted-foreground">Je winkelwagen is leeg.</p>
      ) : (
        <ul className="divide-y divide-border mb-4">
          {validItems.map((item) => (
            <li key={item.id} className="py-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground leading-snug">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  €{item.price.toFixed(2)} p.p.
                </p>
                {onChangeWheelchairAccess && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id={`wheelchair-${item.id}`}
                      checked={item.wheelchairAccess || false}
                      onChange={(e) => onChangeWheelchairAccess(item.id, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label
                      htmlFor={`wheelchair-${item.id}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Ik heb een rolstoel nodig
                    </label>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <NumberInput
                  value={item.quantity}
                  onChange={(value) => onChangeQuantity && onChangeQuantity(item.id, value ?? 1)}
                  min={1}
                  variant={inputVariant}
                />
                {onRemove && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Verwijder"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {showTotal && validItems.length > 0 && (
        <div className="text-lg font-bold text-right mb-2 text-foreground">
          Totaal: €{total.toFixed(2)}
        </div>
      )}
      {showCheckoutButton && items.length > 0 && (
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
