/**
 * Generates a URL-safe slug from a string.
 * Converts to lowercase, replaces spaces and special chars with hyphens,
 * removes consecutive hyphens, and trims leading/trailing hyphens.
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^\w-]+/g, '')
      // Replace multiple consecutive hyphens with a single hyphen
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Generates a unique slug by appending a number if the base slug already exists.
 * Pass a callback function that checks if a slug exists.
 */
export async function generateUniqueSlug(
  baseText: string,
  existsCheck: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = generateSlug(baseText);
  let counter = 1;

  while (await existsCheck(slug)) {
    slug = `${generateSlug(baseText)}-${counter}`;
    counter++;
  }

  return slug;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value?: string): boolean {
  if (!value) return false;
  return SLUG_PATTERN.test(value);
}

export function ensureSlug(value?: string | null, fallback?: string): string {
  const candidate = generateSlug(value || '');
  if (candidate) return candidate;

  if (fallback) {
    const fallbackSlug = generateSlug(fallback);
    if (fallbackSlug) return fallbackSlug;
  }

  throw new Error('Slug is required and must contain only lowercase letters, numbers and hyphens.');
}
