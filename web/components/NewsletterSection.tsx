import NewsletterSignup from './NewsletterSignup';

export default function NewsletterSection() {
  return (
    <section
      className="w-screen relative left-[calc(-50vw+50%)] bg-gradient-to-b from-accent via-primary/20 to-primary/10 py-24 px-4 mb-0 overflow-hidden"
      data-section="newsletter"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/4"></div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="mb-10 flex flex-col items-center">
          <h2
            className="text-4xl md:text-5xl font-bold text-accent-foreground mb-5 tracking-tight"
            data-element="section-title"
          >
            Blijf op de hoogte
          </h2>
          <div
            className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/40 rounded-full"
            data-element="accent-bar"
          ></div>
        </div>
        <p
          className="text-accent-foreground/95 mb-12 text-lg leading-relaxed"
          data-element="section-description"
        >
          Schrijf je in voor onze nieuwsbrief en ontvang als eerste informatie over nieuwe
          voorstellingen en speciale acties.
        </p>
        <div className="max-w-md mx-auto">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  );
}
