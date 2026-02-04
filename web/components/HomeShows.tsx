import PerformanceCard from '@/components/PerformanceCard';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';

type HomeShowsProps = {
  shows: ShowWithTagsAndPerformances[];
};

export default function HomeShows({ shows }: HomeShowsProps) {
  return (
    <section id="performances" className="w-full mb-12">
      <h1 className="text-5xl font-bold text-center text-primary mb-10 font-serif">
        Voorstellingen
      </h1>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {shows.length === 0 ? (
          <div className="text-center text-primary/70">
            Er zijn momenteel geen voorstellingen beschikbaar.
          </div>
        ) : (
          shows.map((show) => <PerformanceCard key={show.id} show={show} tags={show.tags} />)
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
  );
}
