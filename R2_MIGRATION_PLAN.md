# Cloudflare R2 Image Storage Migration Plan

## Overview
Migrate from PostgreSQL bytea storage to Cloudflare R2 for all images, leveraging Next.js Image component for automatic optimization (WebP/AVIF, responsive sizes).

## Target Architecture
- **Storage**: Upload optimized images to R2 public bucket (`ons-mierloos-theater-images`)
- **Processing**: Sharp processes uploads (orientation fix, max 2400px, JPEG 90%) before R2 upload
- **Serving**: Direct R2 URLs via Next.js Image component (removes need for sm/md/lg variants)
- **Database**: Store `r2Url`, `originalWidth`, `originalHeight` instead of bytea columns

## Implementation Phases

### Phase 1: Foundation Setup

**1. Install Dependencies**
```bash
npm install @aws-sdk/client-s3
```

**2. Environment Variables**
Add to `.env.local`:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_IMAGES_BUCKET_NAME=ons-mierloos-theater-images
```

**3. Create R2 Uploader Utility**
- File: `lib/utils/r2ImageUploader.ts`
- Functions:
  - `uploadImageToR2(buffer, filename, contentType)` → Returns R2 public URL
  - `deleteImageFromR2(url)` → Deletes from R2
- Path structure: `images/{uuid}.{ext}`
- Based on IMPLEMENTATION_GUIDE.md pattern (lines 347-419)

**4. Database Migration - Add R2 Fields**
- File: `drizzle/migrations/0026_add_r2_fields_to_images.sql`
- Add columns: `r2_url TEXT`, `original_width INTEGER`, `original_height INTEGER`
- Update `lib/db/schema.ts` to include new fields (keep bytea columns for now)

**5. Configure Next.js Image**
- File: `next.config.ts`
- Add R2 domain to `images.remotePatterns`: `*.r2.cloudflarestorage.com`
- Set formats: `['image/webp', 'image/avif']`

### Phase 2: Dual-Mode Upload Flow

**1. Update Upload Endpoint**
- File: `app/api/upload/route.ts`
- New flow:
  1. Process with Sharp: rotate (orientation fix), resize (max 2400px), convert to JPEG 90%
  2. Extract metadata (width, height)
  3. Upload to R2 via `uploadImageToR2()`
  4. Save to database with `r2Url`, `originalWidth`, `originalHeight`
  5. Skip generating bytea variants for new uploads

**2. Update Image Commands**
- File: `lib/commands/images.ts`
- Update `createImage()` to accept `r2Url`, `originalWidth`, `originalHeight` (all optional for backward compatibility)
- Update `deleteImage()` and `removeUnusedImages()` to delete from R2 if `r2Url` exists

### Phase 3: Migration Script

**1. Create Migration Script**
- File: `scripts/migrate-images-to-r2.ts`
- Logic:
  1. Fetch images WHERE `r2_url IS NULL AND image_lg IS NOT NULL`
  2. For each image: upload `imageLg` to R2, extract dimensions, update database
  3. Batch processing (10-20 at a time)
  4. Error handling with retry logic
  5. Dry-run mode (`--dry-run` flag)
  6. Progress logging and summary report

**2. Add NPM Script**
- File: `package.json`
```json
"migrate:images-to-r2": "node -r dotenv/config --env-file=.env.local --import tsx scripts/migrate-images-to-r2.ts"
```

**3. Run Migration**
```bash
npm run migrate:images-to-r2 -- --dry-run  # Test first
npm run migrate:images-to-r2              # Execute
```

### Phase 4: Update Image Serving (Hybrid Mode)

**1. Update Image Serving Endpoint**
- File: `app/api/images/[id]/route.ts`
- Add R2 redirect: If `image.r2Url` exists, redirect to R2 URL
- Fallback to bytea serving for legacy images

**2. Update URL Utilities**
- File: `lib/utils/image-url.ts`
- Keep `getImageUrl(imageId, size)` for now (returns `/api/images/[id]`)
- Add `getR2ImageUrl(image)` for direct R2 URL access

### Phase 5: Update Components

**1. Remove `unoptimized` Flag from Next.js Images**
Files to update:
- `components/ImageSelector.tsx` (lines 68-74, 123-130)
- `components/blocks/ImageBlock.tsx` (lines 16-22)
- `components/blocks/GalleryBlock.tsx` (lines 43-50)

Change from:
```tsx
<Image src={`/api/images/${imageId}`} unoptimized />
```
To:
```tsx
<Image
  src={`/api/images/${imageId}`}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**2. Convert CSS Backgrounds to Next.js Image** (optional but recommended)
- `components/HeroCarousel.tsx` (line 74)
- `components/FeaturedShowCard.tsx` (line 30)

From:
```tsx
<div style={{ backgroundImage: `url(${getShowImageUrl(show, 'lg')})` }} />
```
To:
```tsx
<Image
  src={getShowImageUrl(show, 'lg')}
  fill
  className="object-cover"
  sizes="100vw"
  priority // For hero carousel
/>
```

**3. Update Other Components**
- `app/admin/images/ImageManagementClient.tsx`
- `components/PerformanceCard.tsx`
- `components/PerformanceDetail.tsx`
- `app/winkelwagen/CartPageClient.tsx`

Add appropriate `sizes` prop to all `<Image>` components.

### Phase 6: Finalize Migration (After Testing Period)

**1. Verify Migration Complete**
Run query: `SELECT COUNT(*) FROM images WHERE r2_url IS NULL;` → Should return 0

**2. Update Queries to Include Image Relations**
- Files: `lib/queries/shows.ts`, `lib/queries/sponsors.ts`, etc.
- Ensure queries include full image object (not just imageId) via LEFT JOIN

**3. Update getImageUrl() to R2-First**
- File: `lib/utils/image-url.ts`
- Change to data-driven:
```typescript
export function getImageUrl(image: { r2Url: string | null }): string {
  return image.r2Url || '/placeholder-performance.svg';
}
```

**4. Update All Component Call Sites**
Change from:
```typescript
const url = getImageUrl(imageId, 'lg');
```
To:
```typescript
const url = getImageUrl(show.image); // Pass full image object
// Or directly: show.image?.r2Url || '/placeholder.svg'
```

**5. Remove /api/images/[id] Endpoint**
- Delete file: `app/api/images/[id]/route.ts`
- All images now served directly from R2

**6. Database Migration - Remove Bytea Columns**
- File: `drizzle/migrations/0027_remove_bytea_columns.sql`
- Drop columns: `image_lg`, `image_md`, `image_sm`
- Update `lib/db/schema.ts`: make `r2Url` NOT NULL, remove bytea fields

**7. Update TypeScript Types**
- File: `lib/db/index.ts`
- Remove: `ImageContent`, `ImageMetadata` types (no longer needed)

### Phase 7: Cleanup

**1. Delete Obsolete Files**
- `lib/utils/imageProcessor.ts` (Next.js Image handles optimization now)

**2. Optimize Next.js Image Sizes**
Review all `<Image>` components and set appropriate `sizes`:
- Hero carousel: `sizes="100vw"`
- Show cards: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`
- Thumbnails: `sizes="200px"`
- Gallery: `sizes="(max-width: 768px) 100vw, 50vw"`

## Critical Files

### Files to Create
1. `lib/utils/r2ImageUploader.ts` - R2 upload/delete utilities
2. `scripts/migrate-images-to-r2.ts` - Migration script
3. `drizzle/migrations/0026_add_r2_fields_to_images.sql` - Add R2 columns
4. `drizzle/migrations/0027_remove_bytea_columns.sql` - Remove bytea columns (Phase 6)

### Files to Modify
**Phase 2:**
- `app/api/upload/route.ts` - R2 upload integration
- `lib/commands/images.ts` - Update create/delete for R2
- `lib/db/schema.ts` - Add r2Url, originalWidth, originalHeight

**Phase 4:**
- `app/api/images/[id]/route.ts` - Add R2 redirect
- `lib/utils/image-url.ts` - Hybrid URL generation
- `lib/utils/performanceImages.ts` - Add R2-aware helpers

**Phase 5:**
- `components/ImageSelector.tsx` - Remove unoptimized
- `components/blocks/ImageBlock.tsx` - Remove unoptimized
- `components/blocks/GalleryBlock.tsx` - Remove unoptimized
- `components/HeroCarousel.tsx` - Convert to Next.js Image
- `components/FeaturedShowCard.tsx` - Convert to Next.js Image
- `app/admin/images/ImageManagementClient.tsx` - Update Image usage
- `components/PerformanceCard.tsx` - Update Image usage
- `components/PerformanceDetail.tsx` - Update Image usage
- `app/winkelwagen/CartPageClient.tsx` - Update Image usage

**Phase 6:**
- `next.config.ts` - Add R2 remotePatterns
- `lib/db/index.ts` - Remove ImageContent/ImageMetadata types
- `lib/queries/*.ts` - Include image relations
- All components using `getImageUrl()` - Pass image object instead of imageId

**Phase 7:**
- `package.json` - Add migration script

### Files to Delete
- `lib/utils/imageProcessor.ts` (Phase 7)
- `app/api/images/[id]/route.ts` (Phase 6)

## Rollback Strategy

During Phases 2-5, system supports dual-mode:
- New uploads → R2
- Old images → bytea fallback
- `/api/images/[id]` redirects R2, serves bytea fallback

If issues arise before Phase 6:
1. Revert component changes (restore `unoptimized` flag)
2. Keep `/api/images/[id]/route.ts`
3. Keep bytea columns
4. R2 images remain as backup, can retry migration later

No data loss - bytea columns retained until Phase 6 finalization.

## Testing & Verification

### After Phase 3 (Migration Script)
- [ ] Verify all images have r2_url: `SELECT COUNT(*) FROM images WHERE r2_url IS NULL;` = 0
- [ ] Spot check: Download 5-10 random R2 URLs, verify images load
- [ ] Check R2 bucket: Verify image count matches database

### After Phase 5 (Component Updates)
- [ ] Visual regression: Homepage, show pages, admin image selector
- [ ] Test upload flow: Upload new image, verify R2 upload and display
- [ ] Test delete flow: Delete unused image, verify R2 deletion
- [ ] Check Network tab: Verify Next.js serves WebP/AVIF
- [ ] Test responsive: Verify different sizes load on mobile/desktop

### After Phase 6 (Finalization)
- [ ] Monitor application logs for 404s or image errors
- [ ] Performance: Compare page load times before/after
- [ ] SEO: Verify images still have proper alt text and dimensions
- [ ] Check R2 costs in Cloudflare dashboard

## Pre-Deployment Checklist

- [ ] Create R2 bucket: `ons-mierloos-theater-images`
- [ ] Configure public access on R2 bucket
- [ ] Generate R2 API token (Edit permissions)
- [ ] Add environment variables to production
- [ ] Test migration script in staging environment
- [ ] Backup database before Phase 6 (optional paranoia)

## Cost Estimate

**R2 Storage** (500 images × 500KB avg = 250MB):
- Storage: $0.015/month
- Class A operations (uploads): $0.0023
- Class B operations (reads): Minimal (Next.js caches)

**Total**: ~$0.02/month (negligible, well within free tier)

## Timeline

- Phase 1 (Foundation): 2-3 hours
- Phase 2 (Upload): 2-3 hours
- Phase 3 (Migration): 3-4 hours
- Phase 4 (Hybrid Serving): 2 hours
- Phase 5 (Components): 4-6 hours
- Phase 6 (Finalization): 2 hours
- Phase 7 (Cleanup): 1 hour

**Total**: 16-21 hours development + 4-6 hours testing = 20-27 hours

## Key Decisions

1. **Store optimized images** (max 2400px, JPEG 90%) in R2 - balances quality vs storage costs
2. **Separate R2 bucket** from PDFs - cleaner organization
3. **Public bucket** - simpler than signed URLs, appropriate for public theater site
4. **Next.js Image optimization** - built-in, no additional service costs
5. **Phased migration** - zero downtime, maintains backward compatibility until finalization
