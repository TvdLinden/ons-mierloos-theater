/**
 * Theater-appropriate font catalogue for Ons Mierloos Theater.
 *
 * All fonts are initialised at module level (required by next/font static analysis).
 * Every font is assigned a *private* CSS variable (e.g. --font-playfair-display).
 * The layout applies all `.variable` class names to <html> so every CSS var is
 * defined across the entire page, then overrides --font-display / --font-body via
 * inline style based on the saved site-settings.
 */
import {
  Playfair_Display,
  Cormorant_Garamond,
  Cinzel,
  EB_Garamond,
  Fraunces,
  Libre_Baskerville,
  Crimson_Pro,
  Source_Serif_4,
  Lato,
  Inter,
  Anton,
} from 'next/font/google';

// ---------------------------------------------------------------------------
// Font initialisations (module-level — Next.js static analysis requirement)
// ---------------------------------------------------------------------------

const _playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  display: 'swap',
});

const _cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant-garamond',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const _cinzel = Cinzel({
  variable: '--font-cinzel',
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const _ebGaramond = EB_Garamond({
  variable: '--font-eb-garamond',
  subsets: ['latin'],
  display: 'swap',
});

const _fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
});

const _libreBaskerville = Libre_Baskerville({
  variable: '--font-libre-baskerville',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const _crimsonPro = Crimson_Pro({
  variable: '--font-crimson-pro',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
});

const _sourceSerif4 = Source_Serif_4({
  variable: '--font-source-serif-4',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
});

const _lato = Lato({
  variable: '--font-lato',
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const _inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const _anton = Anton({
  variable: '--font-anton',
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
});


// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

export interface FontDefinition {
  /** Key stored in the DB (e.g. 'playfair_display') */
  key: string;
  /** Human-readable name shown in the admin UI */
  label: string;
  /** CSS custom property name, e.g. '--font-playfair-display' */
  cssVar: string;
  /** The next/font .variable class — apply to <html> to define the CSS var */
  variableClass: string;
  /** Visual category for grouping */
  category: 'serif' | 'display' | 'sans-serif';
  /** Short preview text rendered in this font */
  sample: string;
}

// ---------------------------------------------------------------------------
// Display / heading fonts
// ---------------------------------------------------------------------------

export const DISPLAY_FONTS: FontDefinition[] = [
  {
    key: 'anton',
    label: 'Anton',
    cssVar: '--font-anton',
    variableClass: _anton.variable,
    category: 'display',
    sample: 'PROGRAMMA',
  },
  {
    key: 'playfair_display',
    label: 'Playfair Display',
    cssVar: '--font-playfair-display',
    variableClass: _playfairDisplay.variable,
    category: 'serif',
    sample: 'De Grote Zaal',
  },
  {
    key: 'cormorant_garamond',
    label: 'Cormorant Garamond',
    cssVar: '--font-cormorant-garamond',
    variableClass: _cormorantGaramond.variable,
    category: 'serif',
    sample: 'De Grote Zaal',
  },
  {
    key: 'cinzel',
    label: 'Cinzel',
    cssVar: '--font-cinzel',
    variableClass: _cinzel.variable,
    category: 'display',
    sample: 'De Grote Zaal',
  },
  {
    key: 'eb_garamond',
    label: 'EB Garamond',
    cssVar: '--font-eb-garamond',
    variableClass: _ebGaramond.variable,
    category: 'serif',
    sample: 'De Grote Zaal',
  },
  {
    key: 'fraunces',
    label: 'Fraunces',
    cssVar: '--font-fraunces',
    variableClass: _fraunces.variable,
    category: 'display',
    sample: 'De Grote Zaal',
  },
  {
    key: 'libre_baskerville',
    label: 'Libre Baskerville',
    cssVar: '--font-libre-baskerville',
    variableClass: _libreBaskerville.variable,
    category: 'serif',
    sample: 'De Grote Zaal',
  },
];

// ---------------------------------------------------------------------------
// Body fonts
// ---------------------------------------------------------------------------

export const BODY_FONTS: FontDefinition[] = [
  {
    key: 'crimson_pro',
    label: 'Crimson Pro',
    cssVar: '--font-crimson-pro',
    variableClass: _crimsonPro.variable,
    category: 'serif',
    sample: 'Verhalen tot leven gebracht op het podium.',
  },
  {
    key: 'eb_garamond',
    label: 'EB Garamond',
    cssVar: '--font-eb-garamond',
    variableClass: _ebGaramond.variable,
    category: 'serif',
    sample: 'Verhalen tot leven gebracht op het podium.',
  },
  {
    key: 'source_serif_4',
    label: 'Source Serif 4',
    cssVar: '--font-source-serif-4',
    variableClass: _sourceSerif4.variable,
    category: 'serif',
    sample: 'Verhalen tot leven gebracht op het podium.',
  },
  {
    key: 'lato',
    label: 'Lato',
    cssVar: '--font-lato',
    variableClass: _lato.variable,
    category: 'sans-serif',
    sample: 'Verhalen tot leven gebracht op het podium.',
  },
  {
    key: 'inter',
    label: 'Inter',
    cssVar: '--font-inter',
    variableClass: _inter.variable,
    category: 'sans-serif',
    sample: 'Verhalen tot leven gebracht op het podium.',
  },
];

// ---------------------------------------------------------------------------
// Helpers used by layout.tsx
// ---------------------------------------------------------------------------

/** De-duplicated list of all fonts — apply their variableClass to <html>. */
export const ALL_FONTS: FontDefinition[] = [
  ...DISPLAY_FONTS,
  ...BODY_FONTS.filter((b) => !DISPLAY_FONTS.some((d) => d.key === b.key)),
];

/** Space-joined class string of every font's variable class — for <html className>. */
export function allFontVariableClasses(): string {
  return ALL_FONTS.map((f) => f.variableClass).join(' ');
}

export const DEFAULT_DISPLAY_FONT_KEY = 'playfair_display';
export const DEFAULT_BODY_FONT_KEY = 'crimson_pro';

/**
 * Look up a FontDefinition by key, falling back to the default if not found.
 */
export function getFontByKey(
  key: string | null | undefined,
  fonts: FontDefinition[],
  defaultKey: string,
): FontDefinition {
  return fonts.find((f) => f.key === key) ?? fonts.find((f) => f.key === defaultKey) ?? fonts[0];
}
