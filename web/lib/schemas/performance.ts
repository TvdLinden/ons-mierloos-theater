import { z } from 'zod';

export const performanceFormSchema = z.object({
  date: z
    .string()
    .min(1, 'Datum en tijd zijn verplicht.')
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Ongeldige datum en tijd.' },
    ),
  price: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // empty is valid (optional)
        return !isNaN(Number(val)) && /^\d+(\.\d{1,2})?$/.test(val);
      },
      { message: 'Prijs moet een geldig decimaal getal zijn (max 2 decimalen).' },
    ),
  rows: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .refine((val) => val > 0 && Number.isInteger(val), {
      message: 'Aantal rijen moet een positief getal zijn.',
    }),
  seatsPerRow: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && Number.isInteger(val), {
      message: 'Aantal zitplaatsen per rij moet een positief getal zijn.',
    }),
  status: z
    .enum(['draft', 'published', 'sold_out', 'cancelled', 'archived'])
    .optional()
    .default('draft'),
  notes: z.string().optional().nullable(),
});

export type PerformanceFormInput = z.infer<typeof performanceFormSchema>;
