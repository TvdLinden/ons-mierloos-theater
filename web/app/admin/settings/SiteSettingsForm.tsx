'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { updateSiteSettingsAction } from './actions';
import { ImageSelector } from '@/components/ImageSelector';
import type { SiteSettings } from '@ons-mierloos-theater/shared/queries/settings';

interface SiteSettingsFormProps {
  initialData: SiteSettings;
  availableImages: Array<{ id: string; filename: string | null }>;
}

export function SiteSettingsForm({ initialData, availableImages }: SiteSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    siteName: initialData.siteName || '',
    siteDescription: initialData.siteDescription || '',
    contactEmail: initialData.contactEmail || '',
    contactPhone: initialData.contactPhone || '',
    contactAddress: initialData.contactAddress || '',
    logoImageId: initialData.logoImageId || null,
    faviconImageId: initialData.faviconImageId || null,
    primaryColor: initialData.primaryColor || '#000000',
    secondaryColor: initialData.secondaryColor || '#ffffff',
    smtpHost: initialData.smtpHost || '',
    smtpPort: initialData.smtpPort || 587,
    smtpUser: initialData.smtpUser || '',
    smtpPassword: initialData.smtpPassword || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateSiteSettingsAction(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Instellingen succesvol opgeslagen' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Er is een fout opgetreden' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="siteName">Sitenaam *</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="contactPhone">Telefoonnummer</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="contactAddress">Adres</Label>
          <Input
            id="contactAddress"
            value={formData.contactAddress}
            onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="siteDescription">Site Beschrijving</Label>
        <Textarea
          id="siteDescription"
          value={formData.siteDescription}
          onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageSelector
          label="Logo"
          selectedImageId={formData.logoImageId}
          availableImages={availableImages}
          onSelect={(id) => setFormData({ ...formData, logoImageId: id })}
          imageSize="medium"
        />

        <ImageSelector
          label="Favicon"
          selectedImageId={formData.faviconImageId}
          availableImages={availableImages}
          onSelect={(id) => setFormData({ ...formData, faviconImageId: id })}
          imageSize="small"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="primaryColor">Primaire Kleur</Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="secondaryColor">Secundaire Kleur</Label>
          <div className="flex gap-2">
            <Input
              id="secondaryColor"
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Email Instellingen (SMTP)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              value={formData.smtpHost}
              onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
              placeholder="smtp.example.com"
            />
          </div>

          <div>
            <Label htmlFor="smtpPort">SMTP Poort</Label>
            <Input
              id="smtpPort"
              type="number"
              value={formData.smtpPort}
              onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="smtpUser">SMTP Gebruikersnaam</Label>
            <Input
              id="smtpUser"
              value={formData.smtpUser}
              onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="smtpPassword">SMTP Wachtwoord</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={formData.smtpPassword}
              onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
              placeholder="Laat leeg om ongewijzigd te laten"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Opslaan...' : 'Instellingen Opslaan'}
      </Button>
    </form>
  );
}
