import { db } from '@/lib/db';
import { coupons, couponPerformances } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Coupon } from '@/lib/db';

export async function createCoupon(
  data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>,
) {
  const [coupon] = await db
    .insert(coupons)
    .values({
      ...data,
      code: data.code.toUpperCase(),
      usageCount: 0,
    })
    .returning();
  return coupon;
}

export async function updateCoupon(
  id: string,
  data: Partial<Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const [coupon] = await db
    .update(coupons)
    .set({
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, id))
    .returning();
  return coupon;
}

export async function deleteCoupon(id: string) {
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function setCouponPerformances(couponId: string, performanceIds: string[]) {
  // Delete existing associations
  await db.delete(couponPerformances).where(eq(couponPerformances.couponId, couponId));

  // Insert new associations if any
  if (performanceIds.length > 0) {
    await db.insert(couponPerformances).values(
      performanceIds.map((performanceId) => ({
        couponId,
        performanceId,
      })),
    );
  }
}

export async function incrementCouponUsage(couponId: string) {
  await db
    .update(coupons)
    .set({
      usageCount: sql`${coupons.usageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, couponId));
}
