import { db } from '../shared/lib/db';
import { newsArticles } from '../shared/lib/db/schema';
import { generateSlug } from '../shared/lib/utils/slug';
import { eq } from 'drizzle-orm';

async function backfillNewsSlugs() {
  try {
    console.log('Starting news article slug backfill...');

    // Get all articles without slugs
    const allArticles = await db.query.newsArticles.findMany({
      orderBy: (table) => table.createdAt,
    });
    const articlesWithoutSlug = allArticles.filter((a) => !a.slug);

    console.log(`Found ${articlesWithoutSlug.length} articles without slugs`);

    if (articlesWithoutSlug.length === 0) {
      console.log('No articles need slug backfill');
      return;
    }

    // Track used slugs to ensure uniqueness
    const usedSlugs = new Set<string>();

    // Get all existing slugs from articles that already have them
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

      await db.update(newsArticles).set({ slug }).where(eq(newsArticles.id, article.id));
    }

    console.log('✓ Backfill completed successfully!');
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfillNewsSlugs();
