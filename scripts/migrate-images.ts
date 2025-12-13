import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { generateImageVariants } from '@/lib/utils/imageProcessor';

async function migrateImages() {
  console.log('Starting image migration...');

  try {
    // First, check if the old 'data' column still exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'images' 
      AND column_name = 'data'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Old "data" column not found. Migration may have already run.');
      console.log('Checking for images without variants...');
    }

    // Get all images that have the old 'data' column populated
    // but don't have variants yet
    const imagesToMigrate = await db.execute(sql`
      SELECT id, filename, mimetype, data
      FROM images
      WHERE data IS NOT NULL
      AND (image_lg IS NULL OR image_md IS NULL OR image_sm IS NULL)
    `);

    if (imagesToMigrate.rows.length === 0) {
      console.log('No images to migrate. All images already have variants.');
      return;
    }

    console.log(`Found ${imagesToMigrate.rows.length} images to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (const image of imagesToMigrate.rows) {
      try {
        console.log(`Processing image: ${image.filename} (${image.id})`);

        // Convert data to Buffer
        if (!image.data) {
          throw new Error('Image data is null or undefined');
        }

        let buffer: Buffer;
        if (Buffer.isBuffer(image.data)) {
          buffer = image.data as Buffer;
        } else if (image.data instanceof Uint8Array) {
          buffer = Buffer.from(image.data);
        } else if (typeof image.data === 'string') {
          // assume base64-encoded string coming from the DB driver
          buffer = Buffer.from(image.data, 'base64');
        } else if (Array.isArray(image.data)) {
          // number[] case
          buffer = Buffer.from(image.data as number[]);
        } else {
          // fallback coercion for any other shape (keeps runtime behavior)
          buffer = Buffer.from(image.data as any);
        }

        // Generate variants
        const variants = await generateImageVariants(buffer);

        // Update the image with variants
        await db.execute(sql`
          UPDATE images
          SET 
            image_lg = ${variants.lg},
            image_md = ${variants.md},
            image_sm = ${variants.sm}
          WHERE id = ${image.id}
        `);

        successCount++;
        console.log(`✓ Migrated: ${image.filename}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating ${image.filename}:`, error);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total images: ${imagesToMigrate.rows.length}`);
    console.log(`✓ Successfully migrated: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);

    if (successCount === imagesToMigrate.rows.length && errorCount === 0) {
      console.log('\n🎉 All images migrated successfully!');
      console.log('\nYou can now safely drop the old "data" column by running:');
      console.log('npm run db:drop-old-image-column');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateImages()
  .then(() => {
    console.log('\nMigration complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
