import FeaturedShowCard from '@/components/FeaturedShowCard';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';

type FeaturedShowsProps = {
  shows: ShowWithTagsAndPerformances[];
  label?: string;
};

export default function FeaturedShows({ shows, label = 'Uitgelicht' }: FeaturedShowsProps) {
  return (
    <section id="performances" className="w-full mb-12">
      <h2 className="text-4xl md:text-5xl font-bold text-center text-primary mb-10 font-serif">
        {label}
      </h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {shows.length === 0 ? (
          <div className="text-center text-primary/70 col-span-full">
            Er zijn momenteel geen voorstellingen beschikbaar.
          </div>
        ) : (
          shows.map((show) => <FeaturedShowCard key={show.id} show={show} />)
        )}
      </div>
      <div className="text-center mt-12">
        <Link href="/voorstellingen">
          <Button type="button" variant="link" size="lg">
            Bekijk alle voorstellingen
          </Button>
        </Link>
      </div>
    </section>
  );
}
