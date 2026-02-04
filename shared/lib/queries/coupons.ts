import { db } from '../db';
import { coupons, couponPerformances, couponUsages } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function getAllCoupons() {
  return await db
    .select({
      id: coupons.id,
      code: coupons.code,
      description: coupons.description,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      minOrderAmount: coupons.minOrderAmount,
      maxUses: coupons.maxUses,
      maxUsesPerUser: coupons.maxUsesPerUser,
      usageCount: coupons.usageCount,
      validFrom: coupons.validFrom,
      validUntil: coupons.validUntil,
      isActive: coupons.isActive,
      createdAt: coupons.createdAt,
      updatedAt: coupons.updatedAt,
    })
    .from(coupons)
    .orderBy(desc(coupons.createdAt));
}

export async function getCouponById(id: string) {
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return coupon;
}

export async function getCouponByCode(code: string) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);
  return coupon;
}

export async function getCouponPerformances(couponId: string) {
  return await db
    .select()
    .from(couponPerformances)
    .where(eq(couponPerformances.couponId, couponId));
}

export async function getCouponUsages(couponId: string) {
  return await db
    .select()
    .from(couponUsages)
    .where(eq(couponUsages.couponId, couponId))
    .orderBy(desc(couponUsages.usedAt));
}

export async function getUserCouponUsageCount(couponId: string, userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(couponUsages)
    .where(and(eq(couponUsages.couponId, couponId), eq(couponUsages.userId, userId)));

  return result[0]?.count || 0;
}
