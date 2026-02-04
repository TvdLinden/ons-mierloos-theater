import { z } from 'zod';

// Base block schema with common fields
const baseBlockSchema = z.object({
  id: z.string(),
  order: z.number(),
});

// Text block - uses markdown editor
export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  textAlignment: z.enum(['text-left', 'text-center', 'text-right']).optional().default('text-left'),
  className: z.string().optional().default(''),
  proseVariant: z.enum(['prose', 'prose-lg', 'prose-sm']).optional().default('prose'),
});

// Image block - single image with optional caption
export const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal('image'),
  imageId: z.string(),
  caption: z.string().optional(),
  alt: z.string().optional(),
});

// YouTube block - embed video
export const youtubeBlockSchema = baseBlockSchema.extend({
  type: z.literal('youtube'),
  url: z.string().url(),
  title: z.string().optional(),
});

// Gallery block - carousel with max 10 images
export const galleryBlockSchema = baseBlockSchema.extend({
  type: z.literal('gallery'),
  imageIds: z.array(z.string()).min(1).max(10),
  caption: z.string().optional(),
  visibleImages: z.number().int().min(1).max(10).default(1),
  imageSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
});

// Union of all block types - will be defined recursively below
export const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  imageBlockSchema,
  youtubeBlockSchema,
  galleryBlockSchema,
  z.lazy(() => columnBlockSchema),
  z.lazy(() => rowBlockSchema),
]);

// Column block - stacks items horizontally, cannot contain other columns
export const columnBlockSchema = baseBlockSchema.extend({
  type: z.literal('column'),
  children: z
    .array(blockSchema)
    .refine((children) => !children.some((child: any) => child.type === 'column'), {
      message: 'Column blocks cannot contain other columns',
    }),
});

// Row block - stacks items vertically, cannot contain other rows
export const rowBlockSchema = baseBlockSchema.extend({
  type: z.literal('row'),
  children: z
    .array(blockSchema)
    .refine((children) => !children.some((child: any) => child.type === 'row'), {
      message: 'Row blocks cannot contain other rows',
    }),
});

// Array of blocks
export const blocksArraySchema = z.array(blockSchema);

// TypeScript types derived from schemas
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type YoutubeBlock = z.infer<typeof youtubeBlockSchema>;
export type GalleryBlock = z.infer<typeof galleryBlockSchema>;
export type ColumnBlock = z.infer<typeof columnBlockSchema>;
export type RowBlock = z.infer<typeof rowBlockSchema>;
export type Block = z.infer<typeof blockSchema>;
export type BlocksArray = z.infer<typeof blocksArraySchema>;
