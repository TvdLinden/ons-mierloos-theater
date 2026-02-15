import { db, imageUsages } from '../db';
import type { BlocksArray, Block } from '../schemas/blocks';
import { eq, and } from 'drizzle-orm';

/**
 * Syncs image usages for a specific entity (show/page).
 * Uses a full-replace pattern:
 *  1. Delete all existing usages for this entity
 *  2. Extract image IDs from the blocks content
 *  3. Insert fresh usages
 *
 * This keeps the image_usages table in sync with the current content.
 */
export async function syncImageUsages(
  entityType: 'show' | 'page',
  entityId: string,
  blocks: BlocksArray | null,
): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete existing usages for this entity
    await tx
      .delete(imageUsages)
      .where(
        and(eq(imageUsages.entityType, entityType), eq(imageUsages.entityId, entityId)),
      );

    // Extract and insert new usages
    if (blocks) {
      const imageIds = extractImageIdsFromBlocks(blocks);
      if (imageIds.length > 0) {
        await tx
          .insert(imageUsages)
          .values(imageIds.map((imageId) => ({ imageId, entityType, entityId })))
          .onConflictDoNothing();
      }
    }
  });
}

/**
 * Recursively walks the blocks tree and extracts all image IDs
 * referenced via data-image-id attributes in text block content.
 */
function extractImageIdsFromBlocks(blocks: BlocksArray): string[] {
  const ids = new Set<string>();

  function walk(block: Block): void {
    // Extract image IDs from text block HTML content
    if (block.type === 'text' && block.content) {
      for (const match of block.content.matchAll(/data-image-id="([^"]+)"/g)) {
        ids.add(match[1]);
      }
    }

    // Recurse into column/row children
    if ('children' in block && Array.isArray(block.children)) {
      for (const child of block.children) {
        walk(child);
      }
    }
  }

  for (const block of blocks) {
    walk(block);
  }

  return [...ids];
}
