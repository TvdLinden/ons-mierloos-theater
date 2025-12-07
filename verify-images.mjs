import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function verify() {
  try {
    await client.connect();

    // Check shows with image links
    const result = await client.query(`
      SELECT 
        s.title,
        i1.filename as main_image,
        i2.filename as thumb_image
      FROM shows s
      LEFT JOIN images i1 ON s.image_id = i1.id
      LEFT JOIN images i2 ON s.thumbnail_image_id = i2.id
      ORDER BY s.title
      LIMIT 10;
    `);

    console.log('\n✓ Sample Shows with Image Links:\n');
    result.rows.forEach((row) => {
      console.log(`  ${row.title}`);
      console.log(`    Main: ${row.main_image || 'NOT LINKED'}`);
      console.log(`    Thumb: ${row.thumb_image || 'NOT LINKED'}`);
    });

    // Count shows with/without images
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(image_id) as with_main_image,
        COUNT(thumbnail_image_id) as with_thumb_image
      FROM shows;
    `);

    console.log(`\n✓ Image Link Statistics:`);
    console.log(`  Total shows: ${stats.rows[0].total}`);
    console.log(`  With main image: ${stats.rows[0].with_main_image}`);
    console.log(`  With thumbnail: ${stats.rows[0].with_thumb_image}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
