import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui';
import { getUpcomingShows } from '@/lib/queries/shows';
import Link from 'next/link';

export default async function HomePage() {
  // Fetch tags for each performance
  const schows = await getUpcomingShows(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-16 px-8 mx-auto sm:items-start">
        <section>
          <div className="text-center mb-20">
            <h1 className="text-6xl font-extrabold mb-6 leading-tight text-primary font-serif">
              Ons Mierloos Theater
            </h1>
            <p className="text-xl text-primary/80 max-w-2xl mx-auto">
              Welkom bij Ons Mierloos Theater, waar passie voor podiumkunsten tot leven komt. Ontdek
              onze diverse voorstellingen, van meeslepende drama&apos;s tot sprankelende komedies,
              en beleef onvergetelijke momenten in een warme en gastvrije omgeving.
            </p>
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
      </main>
    </div>
  );
}
