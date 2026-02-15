import { z } from 'zod';
import { isValidSlug } from '@ons-mierloos-theater/shared/utils/slug';
import { blocksArraySchema } from '@ons-mierloos-theater/shared/schemas/blocks';

export const showFormSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht.'),
  subtitle: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug is verplicht.')
    .refine((val) => isValidSlug(val), {
      message: 'Slug mag alleen kleine letters, cijfers en streepjes bevatten.',
    }),
  price: z
    .string()
    .min(1, 'Prijs is verplicht.')
    .refine((val) => !isNaN(Number(val)) && /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Prijs moet een geldig decimaal getal zijn (max 2 decimalen).',
    }),
  blocks: z
    .string()
    .min(1, 'Inhoud is verplicht.')
    .transform((val) => JSON.parse(val))
    .pipe(blocksArraySchema),
  publicationDate: z.string().optional(),
  depublicationDate: z.string().optional(),
  imageId: z.string().optional(),
  tagIds: z.array(z.string()).optional().default([]),
});

export type ShowFormInput = z.infer<typeof showFormSchema>;
