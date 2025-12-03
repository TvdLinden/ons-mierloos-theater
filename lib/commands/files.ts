import { images } from '@/lib/db/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

export async function uploadFile(
  file: Buffer,
  filename: string,
  mimetype: string,
): Promise<string> {
  const [image] = await db
    .insert(images)
    .values({
      data: file,
      filename,
      mimetype,
      uploadedAt: new Date(),
    })
    .returning();

  return image.id; // or however you get the ID of the inserted row
}

export async function deleteFile(id: string): Promise<void> {
  await db.delete(images).where(eq(images.id, id));
}
