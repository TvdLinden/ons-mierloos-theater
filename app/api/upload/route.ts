import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { Session } from 'next-auth';
import sharp from 'sharp';
import { uploadImageToR2 } from '@/lib/utils/r2ImageStorage';
import { createImage } from '@/lib/commands/images';

export async function POST(req: NextRequest) {
  // 1. Check authentication
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check authorization (only admin and contributor can upload)
  const userRole = session.user.role;
  if (userRole !== 'admin' && userRole !== 'contributor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // 3. Validate file type (server-side, not just extension)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
      { status: 400 },
    );
  }

  // 4. Enforce size limit (10MB for original, we'll compress it)
  const maxSizeInBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
  }

  try {
    // 5. Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Process with Sharp: rotate, resize, convert to JPEG
    const pipeline = sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true }) // Max 2400px
      .jpeg({ quality: 90 });

    const processedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(buffer).metadata();

    // 7. Upload to R2
    const r2Url = await uploadImageToR2(processedBuffer, file.name, 'image/jpeg');

    // 8. Save to database with R2 URL and dimensions
    const image = await createImage({
      filename: file.name,
      mimetype: 'image/jpeg',
      r2Url,
      originalWidth: metadata.width || null,
      originalHeight: metadata.height || null,
    });

    // 9. Return image ID and R2 URL
    return NextResponse.json({
      id: image.id,
      filename: image.filename,
      r2Url: image.r2Url,
      uploadedAt: image.uploadedAt,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to process and save image' }, { status: 500 });
  }
}
