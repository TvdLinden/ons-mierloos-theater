'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSiteSettingsAction } from './actions';
import { ImageSelector } from '@/components/ImageSelector';
import type { SiteSettings } from '@ons-mierloos-theater/shared/queries/settings';
import {
  DISPLAY_FONTS,
  BODY_FONTS,
  DEFAULT_DISPLAY_FONT_KEY,
  DEFAULT_BODY_FONT_KEY,
  type FontDefinition,
} from '@/lib/fonts';

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
    fontDisplay: initialData.fontDisplay || DEFAULT_DISPLAY_FONT_KEY,
    fontBody: initialData.fontBody || DEFAULT_BODY_FONT_KEY,
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

      <div>
        <ImageSelector
          label="Logo"
          selectedImageId={formData.logoImageId}
          availableImages={availableImages}
          onSelect={(id) => setFormData({ ...formData, logoImageId: id })}
          imageSize="medium"
        />
      </div>

      <div className="border-t pt-6 space-y-6">
        <h3 className="text-lg font-semibold">Lettertypen</h3>
        <FontSelector
          label="Titelfont"
          description="Gebruikt voor koppen en titels op de site."
          fonts={DISPLAY_FONTS}
          selectedKey={formData.fontDisplay}
          onSelect={(key) => setFormData({ ...formData, fontDisplay: key })}
        />
        <FontSelector
          label="Tekstfont"
          description="Gebruikt voor alinea's en algemene bodytekst."
          fonts={BODY_FONTS}
          selectedKey={formData.fontBody}
          onSelect={(key) => setFormData({ ...formData, fontBody: key })}
        />
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

// ---------------------------------------------------------------------------
// FontSelector
// ---------------------------------------------------------------------------

interface FontSelectorProps {
  label: string;
  description: string;
  fonts: FontDefinition[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

function FontSelector({ label, description, fonts, selectedKey, onSelect }: FontSelectorProps) {
  const selected = fonts.find((f) => f.key === selectedKey) ?? fonts[0];

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <Select value={selectedKey} onValueChange={onSelect}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue>
            <span style={{ fontFamily: `var(${selected.cssVar})` }}>{selected.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {fonts.map((font) => (
            <SelectItem key={font.key} value={font.key}>
              <span style={{ fontFamily: `var(${font.cssVar})` }} className="text-base">
                {font.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Live preview strip */}
      <p
        className="text-xl text-muted-foreground"
        style={{ fontFamily: `var(${selected.cssVar})` }}
      >
        {selected.sample}
      </p>
    </div>
  );
}
