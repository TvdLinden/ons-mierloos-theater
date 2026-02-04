import { NextResponse } from 'next/server';
import { removeUnusedImages } from '@ons-mierloos-theater/shared/commands/images';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/utils/auth';

export async function POST() {
  // Check authentication and admin role
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user || !['admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deletedCount = await removeUnusedImages();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} dangling image(s) deleted`,
    });
  } catch (error) {
    console.error('Error pruning dangling images:', error);
    return NextResponse.json({ error: 'Failed to prune images' }, { status: 500 });
  }
}
