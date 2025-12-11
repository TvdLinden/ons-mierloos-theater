import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui';
import { getUpcomingShows } from '@/lib/queries/shows';
import { getHomepageContent, getActiveNewsArticles } from '@/lib/queries/content';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

        {/* Voorstellingen Sectie */}
        <section id="performances" className="w-full mb-12">
          <h1 className="text-5xl font-bold text-center text-primary mb-10 font-serif">
            {/* Voorstellingen */}
          </h1>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {schows.length === 0 ? (
              <div className="text-center text-primary/70">
                Er zijn momenteel geen voorstellingen beschikbaar.
              </div>
            ) : (
              schows.map((performance) => (
                <PerformanceCard key={performance.id} show={performance} tags={performance.tags} />
              ))
            )}
          </div>
          <div className="text-center mt-20">
            <Link href="/voorstellingen">
              <Button type="button" variant="link" size="lg">
                Meer voorstelling
              </Button>
            </Link>
          </div>
        </section>

        {/* News Articles Section */}
        {newsArticles.length > 0 && (
          <section className="w-full mb-12">
            <h2 className="text-4xl font-bold text-center text-primary mb-8 font-serif">Nieuws</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {newsArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <CardTitle>{article.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString('nl-NL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : ''}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Markdown content={article.content} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
