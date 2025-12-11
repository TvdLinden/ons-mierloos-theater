'use client';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { NavigationLink, SocialMediaLink } from '@/lib/db';

type ClientLayoutProps = {
  children: React.ReactNode;
  headerLinks: NavigationLink[];
  footerLinks: NavigationLink[];
  socialMediaLinks: SocialMediaLink[];
};

export default function ClientLayout({
  children,
  headerLinks,
  footerLinks,
  socialMediaLinks,
}: ClientLayoutProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <Header navigationLinks={headerLinks} />
        {children}
        <Footer navigationLinks={footerLinks} socialMediaLinks={socialMediaLinks} />
      </CartProvider>
    </SessionProvider>
  );
}
