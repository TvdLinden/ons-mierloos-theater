import type { Metadata } from 'next';
import { getActiveNewsArticles } from '@ons-mierloos-theater/shared/queries/content';
import NewsCard from '@/components/NewsCard';
import NewsletterSection from '@/components/NewsletterSection';

export const metadata: Metadata = {
  title: 'Nieuws | Ons Mierloos Theater',
  description:
    'Lees het laatste nieuws van Ons Mierloos Theater. Artikelen over voorstellingen, evenementen en theaternieuws.',
  openGraph: {
    title: 'Nieuws | Ons Mierloos Theater',
    description:
      'Lees het laatste nieuws van Ons Mierloos Theater. Artikelen over voorstellingen, evenementen en theaternieuws.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'}/nieuws`,
    type: 'website',
  },
};

export default async function NewsPage() {
  const articles = await getActiveNewsArticles(50);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-foreground mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nieuws
        </h1>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {articles.map((article) => (
              <div key={article.id} className="flex flex-col">
                <NewsCard article={article} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nog geen nieuwsartikelen gepubliceerd.</p>
        )}
      </main>

      <NewsletterSection />
    </div>
  );
}
