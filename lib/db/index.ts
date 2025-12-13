import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  shows,
  performances,
  users,
  lineItems,
  orders,
  payments,
  tags,
  showTags,
  images,
  mailingListSubscribers,
  sponsors,
  coupons,
  couponPerformances,
  couponUsages,
  showsRelations,
  performancesRelations,
  usersRelations,
  lineItemsRelations,
  ordersRelations,
  paymentsRelations,
  tagsRelations,
  showTagsRelations,
  sponsorsRelations,
  couponsRelations,
  couponPerformancesRelations,
  couponUsagesRelations,
  pages,
  navigationLinks,
  homepageContent,
  newsArticles,
  socialMediaLinks,
} from '@/lib/db/schema';

export type User = typeof users.$inferSelect;
export type UserRole = User['role'];
export type LineItem = typeof lineItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderStatus = Order['status'];
export type Payment = typeof payments.$inferSelect;
export type PaymentStatus = Payment['status'];
export type Tag = typeof tags.$inferSelect;
export type ShowTag = typeof showTags.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type ShowStatus = Show['status'];
export type Performance = typeof performances.$inferSelect;
export type PerformanceStatus = Performance['status'];
export type MailingListSubscriber = typeof mailingListSubscribers.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type SponsorTier = Sponsor['tier'];
export type Coupon = typeof coupons.$inferSelect;
export type CouponDiscountType = Coupon['discountType'];
export type CouponPerformance = typeof couponPerformances.$inferSelect;
export type CouponUsage = typeof couponUsages.$inferSelect;

// Show with tags and performances
export type ShowWithTags = Show & {
  tags: Tag[];
};

export type ShowWithPerformances = Show & {
  performances: Performance[];
};

export type ShowWithTagsAndPerformances = Show & {
  tags: Tag[];
  performances: Performance[];
};

export type PerformanceWithShow = Performance & {
  show: Show | null;
};

export type Page = typeof pages.$inferSelect;
export type NavigationLink = typeof navigationLinks.$inferSelect;
export type LinkLocation = NavigationLink['location'];
export type HomepageContent = typeof homepageContent.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type SocialMediaLink = typeof socialMediaLinks.$inferSelect;

export type Image = typeof images.$inferSelect;
export type ImageContent = Pick<Image, 'imageLg' | 'imageMd' | 'imageSm'>;
export type ImageMetadata = Omit<Image, keyof ImageContent>;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, {
  schema: {
    shows,
    performances,
    users,
    lineItems,
    orders,
    payments,
    tags,
    showTags,
    images,
    mailingListSubscribers,
    sponsors,
    coupons,
    couponPerformances,
    couponUsages,
    showsRelations,
    performancesRelations,
    usersRelations,
    lineItemsRelations,
    ordersRelations,
    paymentsRelations,
    tagsRelations,
    showTagsRelations,
    sponsorsRelations,
    couponsRelations,
    couponPerformancesRelations,
    couponUsagesRelations,
    pages,
    navigationLinks,
    homepageContent,
    newsArticles,
    socialMediaLinks,
  },
});

export { db };
