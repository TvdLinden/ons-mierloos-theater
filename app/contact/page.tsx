import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Ons Mierloos Theater',
  description: 'Neem contact op met Ons Mierloos Theater',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Contact</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-text-primary">Informatie</h2>
            <div className="space-y-3 text-text-secondary">
              <div>
                <h3 className="font-medium text-text-primary">Adres</h3>
                <p>Ons Mierloos Theater</p>
                <p>Heer van Scherpenzeelweg 14</p>
                <p>5731 EW Mierlo</p>
              </div>

              <div>
                <h3 className="font-medium text-text-primary">Email</h3>
                <p>
                  <a
                    href="mailto:info@onsmierloostheater.nl"
                    className="text-primary hover:underline"
                  >
                    info@onsmierloostheater.nl
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-medium text-text-primary">Website</h3>
                <p>
                  <a
                    href="https://onsmierloostheater.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    www.onsmierloostheater.nl
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-medium text-text-primary">Social Media</h3>
                <div className="flex gap-4 mt-2">
                  <a
                    href="https://www.facebook.com/onsmierloostheater"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Facebook
                  </a>
                  <a
                    href="https://instagram.com/onsmierloostheater"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-text-primary">Stuur ons een bericht</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
                Naam *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-1">
                Onderwerp *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1">
                Bericht *
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              Verstuur bericht
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Locatie</h2>
        <div className="bg-muted rounded-lg h-96 flex items-center justify-center text-text-secondary">
          {/* Placeholder for map - you can integrate Google Maps or similar */}
          <p>Google Maps integratie</p>
        </div>
      </div>
    </div>
  );
}
