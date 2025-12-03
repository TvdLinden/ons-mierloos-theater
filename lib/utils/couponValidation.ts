import {
  getCouponByCode,
  getUserCouponUsageCount,
  getCouponPerformances,
} from '@/lib/queries/coupons';
import type { Coupon } from '@/lib/db';
import type { CartItem } from '@/components/ShoppingCart';

export type CouponValidationResult = {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discountAmount?: number;
};

/**
 * Validate if a coupon can be applied to the current cart
 */
export async function validateCoupon(
  code: string,
  cartItems: CartItem[],
  userId?: string | null,
): Promise<CouponValidationResult> {
  // Fetch coupon by code
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { valid: false, error: 'Ongeldige couponcode' };
  }

  // Check if active
  if (coupon.isActive !== 1) {
    return { valid: false, error: 'Deze coupon is niet meer actief' };
  }

  // Check validity dates
  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    return { valid: false, error: 'Deze coupon is nog niet geldig' };
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return { valid: false, error: 'Deze coupon is verlopen' };
  }

  // Check max uses
  if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
    return { valid: false, error: 'Deze coupon is op' };
  }

  // Check per-user usage limit
  if (coupon.maxUsesPerUser && userId) {
    const userUsageCount = await getUserCouponUsageCount(coupon.id, userId);
    if (userUsageCount >= coupon.maxUsesPerUser) {
      return { valid: false, error: 'Je hebt deze coupon al het maximale aantal keer gebruikt' };
    }
  }

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Check minimum order amount
  if (coupon.minOrderAmount && Number(coupon.minOrderAmount) > cartTotal) {
    return {
      valid: false,
      error: `Minimaal orderbedrag is €${coupon.minOrderAmount}`,
    };
  }

  // Check if coupon is restricted to specific performances
  const couponPerformances = await getCouponPerformances(coupon.id);
  if (couponPerformances.length > 0) {
    const allowedPerformanceIds = couponPerformances.map((cp) => cp.performanceId);
    const hasValidPerformance = cartItems.some((item) => allowedPerformanceIds.includes(item.id));
    if (!hasValidPerformance) {
      return {
        valid: false,
        error: 'Deze coupon is niet geldig voor de geselecteerde voorstellingen',
      };
    }
  }

  // Calculate discount
  const discountAmount = calculateDiscount(coupon, cartItems);

  return {
    valid: true,
    coupon,
    discountAmount,
  };
}

/**
 * Calculate discount amount based on coupon type
 */
export function calculateDiscount(coupon: Coupon, cartItems: CartItem[]): number {
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  switch (coupon.discountType) {
    case 'percentage':
      return (cartTotal * Number(coupon.discountValue)) / 100;

    case 'fixed':
      return Math.min(Number(coupon.discountValue), cartTotal);

    case 'free_tickets':
      // For free tickets, discount the cheapest tickets up to the discount value
      const sortedItems = [...cartItems].sort((a, b) => a.price - b.price);
      let freeTickets = Number(coupon.discountValue);
      let discount = 0;

      for (const item of sortedItems) {
        if (freeTickets <= 0) break;
        const ticketsToDiscount = Math.min(item.quantity, freeTickets);
        discount += item.price * ticketsToDiscount;
        freeTickets -= ticketsToDiscount;
      }

      return discount;

    default:
      return 0;
  }
}
