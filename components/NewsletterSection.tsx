import MailingListSignup from './MailingListSignup';

export default function NewsletterSection() {
  return (
    <section className="w-screen relative left-[calc(-50vw+50%)] bg-secondary/20 py-12 px-4 mb-12">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
          Blijf op de hoogte
        </h2>
        <p className="text-textSecondary mb-8">
          Schrijf je in voor onze nieuwsbrief en ontvang als eerste informatie over nieuwe
          voorstellingen en speciale acties.
        </p>
        <div className="max-w-md mx-auto">
          <MailingListSignup />
        </div>
      </div>
    </section>
  );
}
