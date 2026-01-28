import type { Metadata } from 'next';
import { getUpcomingShows, getRecentlyPassedShows } from '@/lib/queries/shows';
import { getActiveNewsArticles } from '@/lib/queries/content';
import HeroCarousel from '@/components/HeroCarousel';
import FeaturedShows from '@/components/FeaturedShows';
import NewsletterSection from '@/components/NewsletterSection';
import HomeNews from '@/components/HomeNews';

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

export default async function HomePage() {
  let [shows, newsArticles] = await Promise.all([
    getUpcomingShows(0, 10),
    getActiveNewsArticles(3),
  ]);

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

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      {/* Hero Carousel - Full width */}
      <HeroCarousel shows={heroShows} />

      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-8 px-8 mx-auto sm:items-start">
        {/* Featured Shows or Empty State */}
        {shows.length > 0 ? (
          <FeaturedShows shows={featuredShows} label={sectionLabel} />
        ) : (
          <section className="w-full text-center py-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-serif">
              Uitgelicht
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Er zijn momenteel geen voorstellingen beschikbaar. Kom binnenkort terug!
            </p>
          </section>
        )}

        {/* Newsletter Signup */}
        <NewsletterSection />

        {/* News Articles */}
        {newsArticles.length > 0 && <HomeNews articles={newsArticles} />}
      </main>
    </div>
  );
}
