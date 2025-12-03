'use client';

import { useActionState, useState } from 'react';
import { Tag } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type TagFormProps = {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>;
  initialData?: Tag;
};

export default function TagForm({ action, initialData }: TagFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [state, formAction, isPending] = useActionState(action, undefined);

  useEffect(() => {
    if (state && state.error === undefined && !isPending) {
      router.push('/admin/tags');
    }
  }, [state, isPending, router]);

  const handleGenerateSlug = () => {
    const source = name || initialData?.name || '';
    if (!source) return;

    setSlug(generateSlug(source));
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <p className="font-semibold">Fout</p>
          <p className="text-sm">{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-primary mb-2">
          Naam *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-semibold text-primary mb-2">
          Slug *
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          pattern="[a-z0-9-]+"
          placeholder="bijv: komedie-avond"
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
        <div className="mt-2 flex flex-col sm:flex-row justify-between items-start gap-2">
          <p className="text-xs text-zinc-600">
            Alleen kleine letters, cijfers en streepjes toegestaan; laat niet leeg.
          </p>
          <button
            type="button"
            onClick={handleGenerateSlug}
            className="text-xs px-3 py-1.5 bg-primary text-surface rounded hover:bg-secondary transition-colors"
          >
            Genereer slug
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-primary mb-2">
          Beschrijving
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ''}
          rows={3}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex gap-4 pt-4 border-t border-zinc-200">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-primary text-surface rounded-lg hover:bg-secondary font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Bezig...' : initialData ? 'Bijwerken' : 'Toevoegen'}
        </button>
        <a
          href="/admin/tags"
          className="px-6 py-2 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 font-semibold transition-colors"
        >
          Annuleren
        </a>
      </div>
    </form>
  );
}
