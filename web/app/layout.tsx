import type { Metadata } from 'next';
import { Playfair_Display, Crimson_Pro } from 'next/font/google';
import './globals.css';
import ClientLayout from './client-layout';
import { getNavigationLinks } from '@ons-mierloos-theater/shared/queries/content';
import { getActiveSocialMediaLinks } from '@ons-mierloos-theater/shared/queries/socialMedia';
import { cacheTag } from 'next/cache';

const playfairDisplay = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ons Mierloos Theater',
  description: 'Cultuur en theater in Mierlo',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'),
  openGraph: {
    title: 'Ons Mierloos Theater',
    description: 'Cultuur en theater in Mierlo',
    url: '/',
    siteName: 'Ons Mierloos Theater',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ons Mierloos Theater',
    description: 'Cultuur en theater in Mierlo',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  'use cache';
  cacheTag('navigation');
  cacheTag('social-media-links');
  const [headerLinks, footerLinks, socialMediaLinks] = await Promise.all([
    getNavigationLinks('header'),
    getNavigationLinks('footer'),
    getActiveSocialMediaLinks(),
  ]);

  return (
    <html lang="nl">
      <body className={`${playfairDisplay.variable} ${crimsonPro.variable} antialiased`}>
        <ClientLayout
          headerLinks={headerLinks}
          footerLinks={footerLinks}
          socialMediaLinks={socialMediaLinks}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
