import { getUpcomingShows } from '@/lib/queries/shows';
import { getHomepageContent, getActiveNewsArticles } from '@/lib/queries/content';
import HomeShows from '@/components/HomeShows';
import HomeNews from '@/components/HomeNews';
import Markdown from '@/components/ui/markdown';

export default async function HomePage() {
  // Fetch tags for each performance
  const [schows, homepageContent, newsArticles] = await Promise.all([
    getUpcomingShows(0, 6),
    getHomepageContent(),
    getActiveNewsArticles(3),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-16 px-8 mx-auto sm:items-start">
        <section>
          <div className="text-center mb-20">
            <h1 className="text-6xl font-extrabold mb-6 leading-tight text-primary font-serif">
              {homepageContent?.introTitle || 'Ons Mierloos Theater'}
            </h1>
            {homepageContent?.introText ? (
              <div className="max-w-2xl mx-auto">
                <Markdown content={homepageContent.introText} />
              </div>
            ) : (
              <p className="text-xl text-primary/80 max-w-2xl mx-auto">
                Welkom bij Ons Mierloos Theater, waar passie voor podiumkunsten tot leven komt.
                Ontdek onze diverse voorstellingen, van meeslepende drama&apos;s tot sprankelende
                komedies, en beleef onvergetelijke momenten in een warme en gastvrije omgeving.
              </p>
            )}
          </div>
        </section>

        {newsArticles.length > 0 && <HomeNews articles={newsArticles} />}

        <HomeShows shows={schows} />
      </main>
    </div>
  );
}
