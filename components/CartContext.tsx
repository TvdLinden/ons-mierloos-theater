'use client';
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { CartItem } from './ShoppingCart';
import { useLocalStorage } from './useLocalStorage';
import { validateCartItems } from '@/lib/utils/validation';

const CART_KEY = 'shopping_cart';

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>(CART_KEY, []);

  // Validate cart items on mount
  useEffect(() => {
    validateAndCleanupCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateAndCleanupCart = async () => {
    if (items.length === 0) return;

    try {
      const performanceIds = [...new Set(items.map((item) => item.id))];

      // Fetch current performance data from API or database
      const response = await fetch(`/api/performances?ids=${performanceIds.join(',')}`);

      if (!response.ok) {
        console.error('Failed to validate cart items');
        return;
      }

      const performances = await response.json();

      // Validate items against current performance data
      const { valid, invalid, invalidReasons } = validateCartItems(items, performances);

      if (invalid.length > 0) {
        // Update cart with only valid items
        setItems(valid);

        // Show toast notification
        const count = invalid.length;
        console.warn(
          `Removed ${count} unavailable item${count > 1 ? 's' : ''} from cart:`,
          invalidReasons,
        );
      }
    } catch (error) {
      console.error('Error validating cart:', error);
    }
  };

  const addToCart = useCallback(
    (item: CartItem) => {
      setItems((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...prev, { ...item, addedAt: item.addedAt || new Date() }],
      );
    },
    [setItems],
  );

  const removeFromCart = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    },
    [setItems],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
