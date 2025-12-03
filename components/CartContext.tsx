'use client';
import React, { createContext, useContext, useCallback } from 'react';
import { CartItem } from './ShoppingCart';
import { useLocalStorage } from './useLocalStorage';

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

  const addToCart = useCallback(
    (item: CartItem) => {
      setItems((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...prev, item],
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
