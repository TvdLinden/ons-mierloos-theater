import { Button, Input, Label, Textarea } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { MapPin, Mail, Globe, Facebook, Instagram } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact - Ons Mierloos Theater',
  description: 'Neem contact op met Ons Mierloos Theater',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contact</h1>
          <p className="text-muted-foreground mt-1">Neem contact op met Ons Mierloos Theater</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Contact info */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Informatie</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="flex gap-3">
                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-0.5">Adres</p>
                  <p className="text-sm text-muted-foreground">Heer van Scherpenzeelweg 14</p>
                  <p className="text-sm text-muted-foreground">5731 EW Mierlo</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-0.5">E-mail</p>
                  <a
                    href="mailto:info@onsmierloostheater.nl"
                    className="text-sm text-primary hover:underline"
                  >
                    info@onsmierloostheater.nl
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Globe className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-0.5">Website</p>
                  <a
                    href="https://onsmierloostheater.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    www.onsmierloostheater.nl
                  </a>
                </div>
              </div>

              <div className="pt-1 border-t">
                <p className="text-sm font-medium mb-3">Social media</p>
                <div className="flex gap-3">
                  <a
                    href="https://www.facebook.com/onsmierloostheater"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="size-4" />
                    Facebook
                  </a>
                  <a
                    href="https://instagram.com/onsmierloostheater"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="size-4" />
                    Instagram
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact form */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Stuur ons een bericht</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Naam *</Label>
                    <Input id="name" name="name" type="text" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-sm font-medium">Onderwerp *</Label>
                  <Input id="subject" name="subject" type="text" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium">Bericht *</Label>
                  <Textarea id="message" name="message" rows={5} required />
                </div>
                <Button type="submit" className="w-full">
                  Verstuur bericht
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-muted-foreground" />
              Locatie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=5.6117%2C51.4297%2C5.6417%2C51.4497&layer=mapnik&marker=51.4397%2C5.6267"
              width="100%"
              height="400"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              title="Locatie Ons Mierloos Theater"
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
