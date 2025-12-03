'use server';

import { insertTag, updateTag } from '@/lib/commands/tags';
import { ensureSlug } from '@/lib/utils/slug';

type PgErrorLike = {
  code?: string;
  cause?: { code?: string };
  error?: { code?: string };
};

export async function createTag(
  prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const name = formData.get('name') as string;
    const slugInput = formData.get('slug') as string;
    const description = formData.get('description') as string;

    await insertTag({
      name,
      slug: ensureSlug(slugInput, name),
      description: description || undefined,
    });

    return { error: undefined };
  } catch (err) {
    const error = err as PgErrorLike;
    console.error('Error adding tag:', error);
    const errorCode = error.code ?? error.cause?.code ?? error.error?.code;
    if (errorCode === '23505') {
      return { error: 'Deze slug bestaat al. Kies een andere slug.' };
    }
    return {
      error: 'Er is een fout opgetreden bij het toevoegen van de tag. Probeer het opnieuw.',
    };
  }
}

export async function editTag(
  tagId: string,
  prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const name = formData.get('name') as string;
    const slugInput = formData.get('slug') as string;
    const description = formData.get('description') as string;

    await updateTag(tagId, {
      name,
      slug: ensureSlug(slugInput, name),
      description: description || undefined,
    });

    return { error: undefined };
  } catch (err) {
    const error = err as PgErrorLike;
    console.error('Error updating tag:', error);
    const errorCode = error.code ?? error.cause?.code ?? error.error?.code;
    if (errorCode === '23505') {
      return { error: 'Deze slug bestaat al. Kies een andere slug.' };
    }
    return {
      error: 'Er is een fout opgetreden bij het bijwerken van de tag. Probeer het opnieuw.',
    };
  }
}
