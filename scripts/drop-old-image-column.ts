import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function dropOldColumn() {
  console.log('Checking if old "data" column can be safely removed...');

  try {
    // Check if any images still rely on the old column
    const imagesWithoutVariants = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM images
      WHERE data IS NOT NULL
      AND (image_lg IS NULL OR image_md IS NULL OR image_sm IS NULL)
    `);

    const count = Number(imagesWithoutVariants.rows[0]?.count || 0);

    if (count > 0) {
      console.log(`⚠️  Warning: ${count} images still need migration.`);
      console.log('Please run: npm run migrate-images');
      console.log('before dropping the old column.');
      process.exit(1);
    }

    console.log('All images have been migrated to variants.');
    console.log('Dropping old "data" column...');

    await db.execute(sql`
      ALTER TABLE images
      DROP COLUMN IF EXISTS data
    `);

    console.log('✓ Old "data" column removed successfully.');
    console.log('\n🎉 Migration complete! Your database now uses image variants.');
  } catch (error) {
    console.error('Error dropping column:', error);
    process.exit(1);
  }
}

dropOldColumn()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
