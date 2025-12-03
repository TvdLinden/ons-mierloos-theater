import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import crypto from 'crypto';
import { Session } from 'next-auth';

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

  // 4. Enforce size limit (5MB)
  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
  }

  // 5. Generate secure filename (UUID to prevent path traversal and collisions)
  const ext = path.extname(file.name).toLowerCase();
  const secureFilename = `${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, secureFilename);

  // Ensure uploads directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Save file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Return public URL
  const url = `/uploads/${secureFilename}`;
  return NextResponse.json({ url });
}
