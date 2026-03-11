import type { Metadata } from 'next';
import { getUpcomingShows, getRecentlyPassedShows } from '@/lib/queries/shows';
import { getActiveNewsArticles, getHomepageContent } from '@/lib/queries/content';
import HeroCarousel from '@/components/HeroCarousel';
import HeroIntro from '@/components/HeroIntro';
import FeaturedShows from '@/components/FeaturedShows';
import NewsletterSection from '@/components/NewsletterSection';
import HomeNews from '@/components/HomeNews';
import { cacheLife, cacheTag } from 'next/cache';
import { getImageFromR2 } from '@ons-mierloos-theater/shared/utils/r2ImageStorage';

export const metadata: Metadata = {
  title: 'Home | Ons Mierloos Theater',
  description: 'Cultuur en theater in Mierlo - Bekijk onze voorstellingen en actueel nieuws',
  openGraph: {
    title: 'Ons Mierloos Theater',
    description: 'Cultuur en theater in Mierlo',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ons Mierloos Theater',
    description: 'Cultuur en theater in Mierlo',
  },
};

async function getImageBlurDataUrl(id: string, r2Url: string): Promise<string | null> {
  'use cache';
  cacheLife('max');
  cacheTag(`blur-${id}`);

  try {
    const { default: sharp } = await import('sharp');
    const { stream } = await getImageFromR2(r2Url);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const blurBuffer = await sharp(Buffer.concat(chunks))
      .resize(8)
      .jpeg({ quality: 10 })
      .toBuffer();
    return `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
  } catch (e) {
    console.error(`[blur] ${id} failed:`, e);
    return null;
  }
}

export default async function HomePage() {
  const results = await Promise.all([
    getUpcomingShows(0, 10),
    getActiveNewsArticles(3),
    getHomepageContent(),
  ]);

  let shows = results[0];
  const newsArticles = results[1];
  const homepageContent = results[2];
  // Determine if we're showing upcoming or recently passed shows
  let isShowingRecentlyPassed = false;
  if (shows.length === 0) {
    shows = await getRecentlyPassedShows(0, 6);
    isShowingRecentlyPassed = shows.length > 0;
  }

  // Split shows: first 4 with images for hero, up to 6 for featured grid
  const heroShows = shows.filter((s) => s.imageId).slice(0, 4);
  const featuredShows = shows.slice(0, 6);

  // Determine the label based on whether we're showing upcoming or recently passed shows
  const sectionLabel = isShowingRecentlyPassed ? 'Pas gespeeld' : 'Uitgelicht';

  // Enrich shows and news articles with blur data URLs in parallel
  const [featuredShowsWithBlur, newsArticlesWithBlur] = await Promise.all([
    Promise.all(
      featuredShows.map(async (show) => ({
        ...show,
        blurDataUrl:
          show.imageId && show.image?.r2Url
            ? await getImageBlurDataUrl(show.imageId, show.image.r2Url)
            : null,
      })),
    ),
    Promise.all(
      newsArticles.map(async (article) => ({
        ...article,
        blurDataUrl:
          article.imageId && article.image?.r2Url
            ? await getImageBlurDataUrl(article.imageId, article.image.r2Url)
            : null,
      })),
    ),
  ]);

  const heroShowsWithBlur = featuredShowsWithBlur.filter((s) => s.imageId).slice(0, 4);

  return (
    <div
      className="flex min-h-screen flex-col bg-linear-to-bb from-background via-primary/5 to-background"
      data-section="homepage"
    >
      {/* Hero Carousel - Full width */}
      <HeroCarousel shows={heroShowsWithBlur} />

      {/* Hero Intro - Floating overlay on carousel */}
      {/* <HeroIntro introText={homepageContent?.introText} /> */}

      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-8 px-8 mx-auto sm:items-start">
        {/* Featured Shows or Empty State */}
        {shows.length > 0 ? (
          <FeaturedShows shows={featuredShowsWithBlur} label={sectionLabel} />
        ) : (
          <section className="w-full text-center py-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Uitgelicht</h2>
            <p className="text-lg text-gray-600 mb-8">
              Er zijn momenteel geen voorstellingen beschikbaar. Kom binnenkort terug!
            </p>
          </section>
        )}

        {/* Newsletter Signup */}
        <NewsletterSection />

        {/* News Articles */}
        {newsArticlesWithBlur.length > 0 && <HomeNews articles={newsArticlesWithBlur} />}
      </main>
    </div>
  );
}
