import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './client-layout';
import { getNavigationLinks } from '@/lib/queries/content';
import { getActiveSocialMediaLinks } from '@/lib/queries/socialMedia';
import {
  getCachedSiteSettings,
  getCachedEnabledSnippetsByLocation,
} from '@/lib/queries/cachedSettings';
import {
  allFontVariableClasses,
  getFontByKey,
  DISPLAY_FONTS,
  BODY_FONTS,
  DEFAULT_DISPLAY_FONT_KEY,
  DEFAULT_BODY_FONT_KEY,
} from '@/lib/fonts';

export const dynamic = 'force-dynamic';

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
  const [
    headerLinks,
    footerLinks,
    socialMediaLinks,
    headSnippets,
    bodyStartSnippets,
    bodyEndSnippets,
    siteSettings,
  ] = await Promise.all([
    getNavigationLinks('header'),
    getNavigationLinks('footer'),
    getActiveSocialMediaLinks(),
    getCachedEnabledSnippetsByLocation('head'),
    getCachedEnabledSnippetsByLocation('body_start'),
    getCachedEnabledSnippetsByLocation('body_end'),
    getCachedSiteSettings(),
  ]);

  const displayFont = getFontByKey(siteSettings.fontDisplay, DISPLAY_FONTS, DEFAULT_DISPLAY_FONT_KEY);
  const bodyFont = getFontByKey(siteSettings.fontBody, BODY_FONTS, DEFAULT_BODY_FONT_KEY);

  const fontStyle = {
    '--font-display': `var(${displayFont.cssVar})`,
    '--font-body': `var(${bodyFont.cssVar})`,
  } as React.CSSProperties;

  return (
    <html lang="nl" className={allFontVariableClasses()} style={fontStyle}>
      <head>
        {/* Head snippets rendered as raw HTML */}
        {headSnippets.map((snippet) => (
          <div
            key={snippet.id}
            dangerouslySetInnerHTML={{ __html: snippet.html }}
          />
        ))}
      </head>
      <body className="antialiased">
        {bodyStartSnippets.length > 0 && (
          <div
            dangerouslySetInnerHTML={{
              __html: bodyStartSnippets.map((s) => s.html).join('\n'),
            }}
          />
        )}
        <ClientLayout
          headerLinks={headerLinks}
          footerLinks={footerLinks}
          socialMediaLinks={socialMediaLinks}
        >
          {children}
        </ClientLayout>
        {bodyEndSnippets.length > 0 && (
          <div
            dangerouslySetInnerHTML={{
              __html: bodyEndSnippets.map((s) => s.html).join('\n'),
            }}
          />
        )}
      </body>
    </html>
  );
}
