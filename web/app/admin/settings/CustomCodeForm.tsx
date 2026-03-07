'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Check, Pencil, Trash2, Plus, X } from 'lucide-react';
import { createSnippetAction, updateSnippetAction, deleteSnippetAction } from './actions';
import type { CustomCodeSnippet } from '@ons-mierloos-theater/shared/db';

const LOCATION_LABELS: Record<string, string> = {
  head: 'In <head>',
  body_start: 'Begin van <body>',
  body_end: 'Einde van <body>',
};

interface CustomCodeFormProps {
  initialSnippets: CustomCodeSnippet[];
}

interface SnippetFormState {
  name: string;
  location: string;
  html: string;
  isEnabled: boolean;
  sortOrder: number;
}

const emptyForm = (): SnippetFormState => ({
  name: '',
  location: 'head',
  html: '',
  isEnabled: true,
  sortOrder: 0,
});

export function CustomCodeForm({ initialSnippets }: CustomCodeFormProps) {
  const [snippets, setSnippets] = useState<CustomCodeSnippet[]>(initialSnippets);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // null = no form open, 'new' = add form, string id = editing that snippet
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SnippetFormState>(emptyForm());

  function openAddForm() {
    setEditingId('new');
    setFormData(emptyForm());
    setMessage(null);
  }

  function openEditForm(snippet: CustomCodeSnippet) {
    setEditingId(snippet.id);
    setFormData({
      name: snippet.name,
      location: snippet.location,
      html: snippet.html,
      isEnabled: snippet.isEnabled,
      sortOrder: snippet.sortOrder,
    });
    setMessage(null);
  }

  function closeForm() {
    setEditingId(null);
    setFormData(emptyForm());
    setMessage(null);
  }

  function handleSave() {
    if (!formData.name.trim() || !formData.html.trim()) {
      setMessage({ type: 'error', text: 'Naam en HTML zijn verplicht' });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      if (editingId === 'new') {
        const result = await createSnippetAction(formData);
        if (result.success && result.snippet) {
          setSnippets((prev) => [...prev, result.snippet!]);
          closeForm();
          setMessage({ type: 'success', text: 'Snippet aangemaakt' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Er is een fout opgetreden' });
        }
      } else if (editingId) {
        const result = await updateSnippetAction(editingId, formData);
        if (result.success && result.snippet) {
          setSnippets((prev) => prev.map((s) => (s.id === editingId ? result.snippet! : s)));
          closeForm();
          setMessage({ type: 'success', text: 'Snippet bijgewerkt' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Er is een fout opgetreden' });
        }
      }
    });
  }

  function handleToggleEnabled(snippet: CustomCodeSnippet) {
    startTransition(async () => {
      const result = await updateSnippetAction(snippet.id, { isEnabled: !snippet.isEnabled });
      if (result.success && result.snippet) {
        setSnippets((prev) => prev.map((s) => (s.id === snippet.id ? result.snippet! : s)));
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit snippet wilt verwijderen?')) return;
    startTransition(async () => {
      const result = await deleteSnippetAction(id);
      if (result.success) {
        setSnippets((prev) => prev.filter((s) => s.id !== id));
        if (editingId === id) closeForm();
        setMessage({ type: 'success', text: 'Snippet verwijderd' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Er is een fout opgetreden' });
      }
    });
  }

  return (
    <div className="space-y-6">
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

      {/* Snippet list */}
      {snippets.length === 0 && editingId !== 'new' && (
        <p className="text-sm text-muted-foreground">
          Nog geen snippets. Voeg een snippet toe om te beginnen.
        </p>
      )}

      <div className="space-y-2">
        {snippets.map((snippet) => (
          <div key={snippet.id}>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
              <Switch
                checked={snippet.isEnabled}
                onCheckedChange={() => handleToggleEnabled(snippet)}
                disabled={isPending}
                aria-label="Ingeschakeld"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{snippet.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {LOCATION_LABELS[snippet.location] ?? snippet.location}
                  </Badge>
                  {!snippet.isEnabled && (
                    <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
                      Uitgeschakeld
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => (editingId === snippet.id ? closeForm() : openEditForm(snippet))}
                  disabled={isPending}
                  aria-label="Bewerken"
                >
                  {editingId === snippet.id ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(snippet.id)}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                  aria-label="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === snippet.id && (
              <SnippetInlineForm
                formData={formData}
                setFormData={setFormData}
                isPending={isPending}
                onSave={handleSave}
                onCancel={closeForm}
                isNew={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add new snippet */}
      {editingId === 'new' ? (
        <SnippetInlineForm
          formData={formData}
          setFormData={setFormData}
          isPending={isPending}
          onSave={handleSave}
          onCancel={closeForm}
          isNew
        />
      ) : (
        <Button variant="outline" onClick={openAddForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Snippet toevoegen
        </Button>
      )}
    </div>
  );
}

interface SnippetInlineFormProps {
  formData: SnippetFormState;
  setFormData: React.Dispatch<React.SetStateAction<SnippetFormState>>;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}

function SnippetInlineForm({
  formData,
  setFormData,
  isPending,
  onSave,
  onCancel,
  isNew,
}: SnippetInlineFormProps) {
  return (
    <div className="mt-1 p-4 border rounded-lg bg-muted/30 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="snippet-name">Naam *</Label>
          <Input
            id="snippet-name"
            value={formData.name}
            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
            placeholder="bijv. Google Tag Manager"
          />
        </div>

        <div>
          <Label htmlFor="snippet-location">Locatie *</Label>
          <Select
            value={formData.location}
            onValueChange={(val) => setFormData((f) => ({ ...f, location: val }))}
          >
            <SelectTrigger id="snippet-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head">In &lt;head&gt;</SelectItem>
              <SelectItem value="body_start">Begin van &lt;body&gt;</SelectItem>
              <SelectItem value="body_end">Einde van &lt;body&gt;</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="snippet-sort-order">Volgorde</Label>
          <Input
            id="snippet-sort-order"
            type="number"
            value={formData.sortOrder}
            onChange={(e) =>
              setFormData((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))
            }
          />
        </div>

        <div className="flex items-end gap-3 pb-1">
          <Switch
            id="snippet-enabled"
            checked={formData.isEnabled}
            onCheckedChange={(val) => setFormData((f) => ({ ...f, isEnabled: val }))}
          />
          <Label htmlFor="snippet-enabled" className="cursor-pointer">
            Ingeschakeld
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="snippet-html">HTML *</Label>
        <Textarea
          id="snippet-html"
          value={formData.html}
          onChange={(e) => setFormData((f) => ({ ...f, html: e.target.value }))}
          rows={8}
          className="font-mono text-sm"
          placeholder={'<script>\n  // Jouw code hier\n</script>'}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? 'Opslaan...' : isNew ? 'Snippet aanmaken' : 'Wijzigingen opslaan'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}
