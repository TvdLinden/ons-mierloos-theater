'use client';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <Header />
        {children}
        <Footer />
      </CartProvider>
    </SessionProvider>
  );
}
