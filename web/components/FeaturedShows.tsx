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
      className="w-full py-20 px-8 mx-auto max-w-7xl mb-0 relative"
      data-section="featured-shows"
    >
      {/* Bold gradient background container */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 rounded-3xl -z-10 blur-3xl"
        data-element="bg-gradient"
      ></div>

      <div className="mb-16">
        <h2
          className="text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight"
          data-element="section-title"
        >
          {label}
        </h2>
        <div
          className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"
          data-element="accent-bar"
        ></div>
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
