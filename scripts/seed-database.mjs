import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('Using DATABASE_URL:', DATABASE_URL);

const { Client } = pg;

const client = new Client({
  connectionString: DATABASE_URL,
});

async function seedDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    const uploadsDir = path.join(__dirname, '../public/uploads');
    const imageFiles = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.jpg'));

    console.log(`\nInserting ${imageFiles.length} images into database...\n`);

    let inserted = 0;
    for (const filename of imageFiles) {
      const filepath = path.join(uploadsDir, filename);
      const data = fs.readFileSync(filepath);

      await client.query(
        'INSERT INTO images (filename, mimetype, data) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [filename, 'image/jpeg', data],
      );

      inserted++;
      if (inserted % 10 === 0) {
        console.log(`✓ Inserted ${inserted}/${imageFiles.length} images`);
      }
    }

    console.log(`\n✓ Successfully inserted all ${inserted} images into database`);

    // Now run the SQL seed script for shows, performances, tags, etc.
    console.log('\nRunning SQL seed script for shows, performances, and tags...\n');

    const seedSQL = fs.readFileSync(path.join(__dirname, './seed.sql'), 'utf-8');

    // Execute the entire SQL file as one transaction
    try {
      await client.query(seedSQL);
      console.log('✓ SQL seed script executed successfully');
    } catch (error) {
      console.error('Error executing seed.sql:', error.message);
      throw error;
    }

    console.log('\n✓ Database seeding completed successfully!');

    // Clean up generated images
    console.log('\nCleaning up generated images...');
    const imageFilesToDelete = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.jpg'));

    for (const filename of imageFilesToDelete) {
      fs.unlinkSync(path.join(uploadsDir, filename));
    }

    console.log(`✓ Removed ${imageFilesToDelete.length} generated images from public/uploads/`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
