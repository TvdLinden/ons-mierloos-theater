'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { updateSeoSettingsAction } from './actions';
import type { SeoSettings } from '@ons-mierloos-theater/shared/queries/settings';

interface SeoSettingsFormProps {
  initialData: SeoSettings;
}

export function SeoSettingsForm({ initialData }: SeoSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    defaultTitle: initialData.defaultTitle || '',
    defaultDescription: initialData.defaultDescription || '',
    defaultKeywords: initialData.defaultKeywords || '',
    ogImage: initialData.ogImage || '',
    ogType: initialData.ogType || 'website',
    twitterCard: initialData.twitterCard || 'summary_large_image',
    twitterSite: initialData.twitterSite || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateSeoSettingsAction(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'SEO instellingen succesvol opgeslagen' });
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

      <div>
        <Label htmlFor="defaultTitle">Standaard Titel *</Label>
        <Input
          id="defaultTitle"
          value={formData.defaultTitle}
          onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
          placeholder="Ons Mierloos Theater"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          Gebruikt wanneer geen specifieke titel is ingesteld
        </p>
      </div>

      <div>
        <Label htmlFor="defaultDescription">Standaard Beschrijving</Label>
        <Textarea
          id="defaultDescription"
          value={formData.defaultDescription}
          onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
          placeholder="Een korte beschrijving van uw theater..."
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Maximaal 160 karakters voor optimale weergave in zoekmachines
        </p>
      </div>

      <div>
        <Label htmlFor="defaultKeywords">Standaard Zoekwoorden</Label>
        <Input
          id="defaultKeywords"
          value={formData.defaultKeywords}
          onChange={(e) => setFormData({ ...formData, defaultKeywords: e.target.value })}
          placeholder="theater, voorstellingen, entertainment"
        />
        <p className="text-sm text-muted-foreground mt-1">Komma-gescheiden lijst van zoekwoorden</p>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Open Graph Tags (Social Media)</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ogImage">OG Image URL</Label>
            <Input
              id="ogImage"
              value={formData.ogImage}
              onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Afbeelding die getoond wordt bij delen op sociale media (min. 1200x630px)
            </p>
          </div>

          <div>
            <Label htmlFor="ogType">OG Type</Label>
            <Input
              id="ogType"
              value={formData.ogType}
              onChange={(e) => setFormData({ ...formData, ogType: e.target.value })}
              placeholder="website"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Twitter Card Tags</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="twitterCard">Twitter Card Type</Label>
            <select
              id="twitterCard"
              value={formData.twitterCard}
              onChange={(e) => setFormData({ ...formData, twitterCard: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
          </div>

          <div>
            <Label htmlFor="twitterSite">Twitter Site Handle</Label>
            <Input
              id="twitterSite"
              value={formData.twitterSite}
              onChange={(e) => setFormData({ ...formData, twitterSite: e.target.value })}
              placeholder="@yourusername"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Opslaan...' : 'SEO Instellingen Opslaan'}
      </Button>
    </form>
  );
}
