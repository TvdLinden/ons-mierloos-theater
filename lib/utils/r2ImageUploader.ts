import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Initialize Cloudflare R2 client
 * Uses S3-compatible API with R2-specific endpoints
 */
const createR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 configuration: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY required'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

/**
 * Upload an image to Cloudflare R2
 * @param buffer Image buffer
 * @param filename Original filename for extension detection
 * @param contentType MIME type of the image
 * @returns Public URL to the uploaded image in R2
 */
export async function uploadImageToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const client = createR2Client();
  const bucketName = process.env.R2_IMAGES_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('Missing R2_IMAGES_BUCKET_NAME environment variable');
  }

  // Generate unique filename with original extension
  const ext = filename.split('.').pop() || 'jpg';
  const uniqueFilename = `images/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueFilename,
    Body: buffer,
    ContentType: contentType,
    // Allow public read access
    ACL: 'public-read',
    // Cache for 1 year (images are immutable)
    CacheControl: 'public, max-age=31536000, immutable',
  });

  try {
    await client.send(command);

    // Construct public URL using custom domain if available
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      throw new Error('Missing R2_PUBLIC_URL environment variable');
    }

    const r2Url = `${publicUrl}/${uniqueFilename}`;

    return r2Url;
  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw new Error(`Failed to upload image to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an image from Cloudflare R2
 * @param r2Url Full R2 URL of the image to delete
 */
export async function deleteImageFromR2(r2Url: string): Promise<void> {
  const client = createR2Client();
  const bucketName = process.env.R2_IMAGES_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('Missing R2_IMAGES_BUCKET_NAME environment variable');
  }

  // Extract key from URL
  // URL format: https://[bucket-name].[account-id].r2.cloudflarestorage.com/[key]
  const urlPattern = new RegExp(`https://${bucketName}\\..*\\.r2\\.cloudflarestorage\\.com/(.+)$`);
  const match = r2Url.match(urlPattern);

  if (!match || !match[1]) {
    throw new Error(`Invalid R2 URL format: ${r2Url}`);
  }

  const key = match[1];

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('Error deleting image from R2:', error);
    throw new Error(`Failed to delete image from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
