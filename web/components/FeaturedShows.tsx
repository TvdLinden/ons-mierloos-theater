import FeaturedShowCard from '@/components/FeaturedShowCard';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ShowWithBlurData } from '@/lib/utils/performanceImages';

type FeaturedShowsProps = {
  shows: ShowWithBlurData[];
  label?: string;
};

export default function FeaturedShows({ shows, label = 'Uitgelicht' }: FeaturedShowsProps) {
  return (
    <section
      id="performances"
      className="w-full py-12 px-4 mx-auto max-w-7xl mb-0"
      data-section="featured-shows"
    >
      {/* Section heading — bold condensed all-caps like "PROGRAMMA" in the concept */}
      <div className="mb-10">
        <h2
          className="text-6xl md:text-7xl uppercase text-foreground leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
          data-element="section-title"
        >
          {label}
        </h2>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {shows.length === 0 ? (
          <div className="text-center text-primary/70 col-span-full">
            Er zijn momenteel geen voorstellingen beschikbaar.
          </div>
        ) : (
          shows.map((show) => <FeaturedShowCard key={show.id} show={show} />)
        )}
      </div>

      <div className="text-center mt-10">
        <Link href="/voorstellingen">
          <Button type="button" variant="link" size="lg">
            Bekijk alle voorstellingen
          </Button>
        </Link>
      </div>
    </section>
  );
}
