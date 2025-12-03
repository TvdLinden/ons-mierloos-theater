import type { Metadata } from 'next';
import { Playfair_Display, Crimson_Pro } from 'next/font/google';
import './globals.css';
import ClientLayout from './client-layout';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${playfairDisplay.variable} ${crimsonPro.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
