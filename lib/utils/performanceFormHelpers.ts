import { mapFormToPerformance } from './mapFormToPerformance';
import type { Performance, PerformanceStatus } from '@/lib/db';
import { isValidSlug } from './slug';

export type PerformanceFormData = {
  title: string;
  subtitle?: string;
  date: string;
  description: string;
  slug: string;
  price: string;
  status: PerformanceStatus;
  publicationDate?: string;
  depublicationDate?: string;
};

export type FormValidationResult = {
  success: boolean;
  error?: string;
  data?: Partial<Performance>;
  tagIds?: string[];
};

/**
 * Parse performance form data from FormData
 */
export function parsePerformanceForm(formData: FormData): {
  form: PerformanceFormData;
  tagIds: string[];
  image?: File;
} {
  return {
    form: {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      price: formData.get('price') as string,
      slug: formData.get('slug') as string,
      status: formData.get('status') as PerformanceFormData['status'],
      publicationDate: formData.get('publicationDate') as string,
      depublicationDate: formData.get('depublicationDate') as string,
    },
    tagIds: formData.getAll('tagIds') as string[],
    image: formData.get('image') as File,
  };
}

/**
 * Validate performance form data
 */
export function validatePerformanceForm(form: PerformanceFormData): {
  valid: boolean;
  error?: string;
} {
  if (!form.title || !form.date || !form.description) {
    return { valid: false, error: 'Titel, datum en beschrijving zijn verplicht.' };
  }

  if (!isValidSlug(form.slug)) {
    return {
      valid: false,
      error: 'Slug is verplicht en mag alleen kleine letters, cijfers en streepjes bevatten.',
    };
  }

  if (!form.price || isNaN(Number(form.price)) || !/^\d+(\.\d{1,2})?$/.test(form.price)) {
    return {
      valid: false,
      error: 'Prijs is verplicht en moet een geldig decimaal getal zijn (max 2 decimalen).',
    };
  }

  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const fileType = file.type || '';

  if (!allowedTypes.includes(fileType)) {
    return { valid: false, error: 'Alleen JPEG en PNG afbeeldingen zijn toegestaan.' };
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return { valid: false, error: 'De afbeelding mag niet groter zijn dan 5MB.' };
  }

  return { valid: true };
}

/**
 * Process performance form data into Performance object
 */
export function processPerformanceData(
  form: PerformanceFormData,
  imageId?: string,
  thumbnailImageId?: string,
): Omit<Performance, 'id'> {
  const performance = mapFormToPerformance(form);

  if (imageId) {
    performance.imageId = imageId;
  }
  if (thumbnailImageId) {
    performance.thumbnailImageId = thumbnailImageId;
  }

  return performance as Omit<Performance, 'id'>;
}
