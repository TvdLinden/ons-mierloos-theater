import { Metadata } from 'next';
import Image from 'next/image';
import { getActiveSponsors } from '@ons-mierloos-theater/shared/queries/sponsors';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image';

export const metadata: Metadata = {
  title: 'Sponsors - ONS Mierloos Theater',
  description: 'Onze sponsors en partners',
};

const tierConfig = {
  gold: {
    title: 'Gouden Sponsors',
    color: 'text-secondary',
    size: 'w-64 h-32',
  },
  silver: {
    title: 'Zilveren Sponsors',
    color: 'text-text-secondary',
    size: 'w-48 h-24',
  },
  bronze: {
    title: 'Bronzen Sponsors',
    color: 'text-text-secondary',
    size: 'w-40 h-20',
  },
};

export default async function SponsorsPage() {
  const sponsors = await getActiveSponsors();

  const goldSponsors = sponsors.filter((s) => s.tier === 'gold');
  const silverSponsors = sponsors.filter((s) => s.tier === 'silver');
  const bronzeSponsors = sponsors.filter((s) => s.tier === 'bronze');

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-bold mb-4 text-text-primary text-center">Onze Sponsors</h1>
      <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
        ONS Mierloos Theater wordt mede mogelijk gemaakt door onze waardevolle sponsors en partners.
        Wij zijn hen zeer dankbaar voor hun steun.
      </p>

      {/* Gold Sponsors */}
      {goldSponsors.length > 0 && (
        <section className="mb-16">
          <h2 className={`text-3xl font-semibold mb-8 text-center ${tierConfig.gold.color}`}>
            {tierConfig.gold.title}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {goldSponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tierConfig.gold.size} flex items-center justify-center bg-surface border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow`}
              >
                {sponsor.logoId && sponsor.logo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={getImageUrl(sponsor.logoId)}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="256px"
                    />
                  </div>
                ) : (
                  <span className="text-text-primary font-semibold">{sponsor.name}</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Silver Sponsors */}
      {silverSponsors.length > 0 && (
        <section className="mb-16">
          <h2 className={`text-2xl font-semibold mb-8 text-center ${tierConfig.silver.color}`}>
            {tierConfig.silver.title}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {silverSponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tierConfig.silver.size} flex items-center justify-center bg-surface border-2 border-border rounded-lg p-4 hover:shadow-lg transition-shadow`}
              >
                {sponsor.logoId && sponsor.logo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={getImageUrl(sponsor.logoId)}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="192px"
                    />
                  </div>
                ) : (
                  <span className="text-text-primary font-semibold">{sponsor.name}</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Bronze Sponsors */}
      {bronzeSponsors.length > 0 && (
        <section className="mb-16">
          <h2 className={`text-xl font-semibold mb-8 text-center ${tierConfig.bronze.color}`}>
            {tierConfig.bronze.title}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {bronzeSponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tierConfig.bronze.size} flex items-center justify-center bg-surface border border-border rounded-lg p-3 hover:shadow-lg transition-shadow`}
              >
                {sponsor.logoId && sponsor.logo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={getImageUrl(sponsor.logoId)}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="160px"
                    />
                  </div>
                ) : (
                  <span className="text-text-primary font-medium">{sponsor.name}</span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <div className="bg-muted rounded-lg p-8 text-center mt-16">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">
          Word sponsor van ONS Mierloos Theater
        </h2>
        <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
          Bent u geïnteresseerd in een sponsorschap? Neem contact met ons op om de mogelijkheden te
          bespreken.
        </p>
        <a
          href="/contact"
          className="inline-block bg-primary text-white py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Contact opnemen
        </a>
      </div>
    </div>
  );
}
