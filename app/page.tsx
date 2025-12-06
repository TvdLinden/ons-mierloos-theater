import PerformanceCard from '@/components/PerformanceCard';
import { getUpcomingShows } from '@/lib/queries/shows';

export default async function HomePage() {
  // Fetch tags for each performance
  const schows = await getUpcomingShows();

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      <main className="grow w-full max-w-4xl flex-col items-center justify-between py-16 px-8 mx-auto sm:items-start">
        {/* Voorstellingen Sectie */}
        <section id="performances" className="w-full mb-12">
          <h1 className="text-5xl font-bold text-center text-primary mb-10 font-serif">
            {/* Voorstellingen */}
          </h1>
          <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2">
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
        </section>
      </main>
    </div>
  );
}
