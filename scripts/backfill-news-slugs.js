import { db } from '../shared/lib/db/index.js';
import { newsArticles } from '../shared/lib/db/schema.js';
import { generateSlug } from '../shared/lib/utils/slug.js';

async function backfillNewsSlugs() {
  try {
    console.log('Starting news article slug backfill...');

    // Get all articles
    const allArticles = await db.query.newsArticles.findMany({
      orderBy: (table) => table.createdAt,
    });

    console.log(`Found ${allArticles.length} articles total`);

    const articlesWithoutSlug = allArticles.filter((a) => !a.slug);
    console.log(`Found ${articlesWithoutSlug.length} articles without slugs`);

    if (articlesWithoutSlug.length === 0) {
      console.log('No articles need slug backfill');
      return;
    }

    // Track used slugs to ensure uniqueness
    const usedSlugs = new Set();

    // Get all existing slugs
    allArticles.forEach((article) => {
      if (article.slug) {
        usedSlugs.add(article.slug);
      }
    });

    // Backfill slugs for articles without them
    for (const article of articlesWithoutSlug) {
      let slug = generateSlug(article.title);
      let counter = 1;

      // Ensure uniqueness
      while (usedSlugs.has(slug)) {
        slug = `${generateSlug(article.title)}-${counter}`;
        counter++;
      }

      console.log(`Setting slug for article "${article.title}": ${slug}`);
      usedSlugs.add(slug);

      // Update using raw db
      await db
        .update(newsArticles)
        .set({ slug })
        .where((t) => t.id === article.id);
    }

    console.log('✓ Backfill completed successfully!');
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfillNewsSlugs();
