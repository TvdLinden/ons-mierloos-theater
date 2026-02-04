import { CartPageClient } from './CartPageClient';
import { getUpcomingShows } from '@ons-mierloos-theater/shared/queries/shows';

export default async function CartPage() {
  // Get a few upcoming shows for recommendations
  const upcomingShows = await getUpcomingShows(0, 3);

  return <CartPageClient recommendedShows={upcomingShows} />;
}
