import NewsletterSignup from './NewsletterSignup';

export default function NewsletterSection() {
  return (
    <section
      className="w-screen relative left-[calc(-50vw+50%)] py-16 md:py-20"
      style={{ backgroundColor: 'var(--color-parchment)' }}
      data-section="newsletter"
    >
      <div className="max-w-7xl mx-auto px-8">
        <h2
          className="text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
          data-element="section-title"
        >
          Blijf op de hoogte
        </h2>
        <p className="mt-4 text-foreground/70 text-base md:text-lg max-w-lg">
          Schrijf je in voor onze nieuwsbrief en ontvang als eerste informatie over nieuwe
          voorstellingen en speciale acties.
        </p>
        <div className="mt-8 max-w-md">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  );
}
