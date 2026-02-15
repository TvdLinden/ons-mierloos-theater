import type { BlocksArray, Block } from '@ons-mierloos-theater/shared/schemas/blocks';

/**
 * Uploads all base64 images in blocks and replaces them with R2 URLs and data-image-id attributes.
 * Walks the block tree recursively, finds data: URIs in text block HTML, uploads them,
 * and returns blocks with cleaned HTML containing r2Url and data-image-id attributes.
 */
export async function uploadImagesFromBlocks(blocks: BlocksArray | null): Promise<BlocksArray | null> {
  if (!blocks) return null;

  const processedBlocks = await Promise.all(blocks.map((block) => processBlock(block)));
  return processedBlocks;
}

async function processBlock(block: Block): Promise<Block> {
  // Process text blocks with potential base64 images
  if (block.type === 'text' && block.content) {
    const cleanedContent = await uploadImagesInHTML(block.content);
    return { ...block, content: cleanedContent };
  }

  // Recursively process children in column/row blocks
  if ('children' in block && Array.isArray(block.children)) {
    const processedChildren = await Promise.all(
      block.children.map((child) => processBlock(child))
    );
    return { ...block, children: processedChildren };
  }

  return block;
}

/**
 * Finds all data: URIs in HTML, uploads them, and replaces with R2 URLs with data-image-id.
 */
async function uploadImagesInHTML(html: string): Promise<string> {
  let processedHtml = html;

  // Find all data: URIs in img tags
  const dataImageRegex = /<img[^>]*src="(data:[^"]+)"[^>]*>/g;
  const matches = Array.from(html.matchAll(dataImageRegex));

  for (const match of matches) {
    const dataUri = match[1];
    const fullImgTag = match[0];

    try {
      // Convert data URI to blob and upload
      const uploadedImg = await uploadDataURIImage(dataUri);

      // Create new img tag with r2Url and data-image-id
      const newImgTag = fullImgTag
        .replace(`src="${dataUri}"`, `src="${uploadedImg.r2Url}"`)
        .replace(/>/, ` data-image-id="${uploadedImg.id}" />`);

      processedHtml = processedHtml.replace(fullImgTag, newImgTag);
    } catch (error) {
      console.error('Error uploading image from blocks:', error);
      // Keep the original img tag if upload fails
    }
  }

  return processedHtml;
}

/**
 * Uploads a data URI image to R2 and returns {id, r2Url}.
 */
async function uploadDataURIImage(
  dataUri: string
): Promise<{ id: string; r2Url: string }> {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data: dataUri }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, r2Url: data.url };
}
