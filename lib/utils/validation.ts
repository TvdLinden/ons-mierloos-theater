/**
 * Validation utilities for performances and cart items
 */

export interface Performance {
  id: string;
  date: string | Date;
  status: string;
  availableSeats?: number;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  performanceDate?: Date;
  addedAt?: Date;
}

/**
 * Check if a performance is available for purchase
 * A performance is available if:
 * - Date is in the future
 * - Status is 'published'
 * - Has available seats
 */
export function isPerformanceAvailable(performance: Performance): boolean {
  const now = new Date();
  const performanceDate = new Date(performance.date);

  return (
    performanceDate > now &&
    performance.status === 'published' &&
    (performance.availableSeats || 0) > 0
  );
}

/**
 * Validate cart items against current performance data
 * Returns valid items, invalid items, and reasons for invalidation
 */
export function validateCartItems(
  items: CartItem[],
  performances: Performance[],
): {
  valid: CartItem[];
  invalid: CartItem[];
  invalidReasons: Record<string, string>;
} {
  const invalidReasons: Record<string, string> = {};
  const now = new Date();

  const { valid, invalid } = items.reduce(
    (acc, item) => {
      const perf = performances.find((p) => p.id === item.id);

      if (!perf) {
        acc.invalid.push(item);
        invalidReasons[item.id] = 'Performance not found';
      } else if (!isPerformanceAvailable(perf)) {
        acc.invalid.push(item);
        const perfDate = new Date(perf.date);

        if (perfDate <= now) {
          invalidReasons[item.id] = 'Performance date has passed';
        } else if (perf.status !== 'published') {
          invalidReasons[item.id] = 'Performance is no longer available';
        } else {
          invalidReasons[item.id] = 'No seats available';
        }
      } else {
        acc.valid.push(item);
      }

      return acc;
    },
    { valid: [] as CartItem[], invalid: [] as CartItem[] },
  );

  return { valid, invalid, invalidReasons };
}

/**
 * Check if an item in the cart is expired
 */
export function isCartItemExpired(item: CartItem): boolean {
  if (!item.performanceDate) return false;
  const now = new Date();
  return item.performanceDate <= now;
}

/**
 * Get reason why a performance is no longer available
 */
export function getUnavailabilityReason(performance: Performance): string {
  const now = new Date();
  const perfDate = new Date(performance.date);

  if (perfDate <= now) {
    return 'Performance date has passed';
  } else if (performance.status !== 'published') {
    return 'Performance is no longer available';
  } else if ((performance.availableSeats || 0) <= 0) {
    return 'No seats available';
  }

  return 'Unknown reason';
}
