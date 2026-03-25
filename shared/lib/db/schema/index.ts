// Re-export all tables and enums
export * from './images';
export * from './shows';
export * from './tags';
export * from './users';
export * from './orders';
export * from './payments';
export * from './coupons';
export * from './sponsors';
export * from './content';
export * from './settings';
export * from './oauth';
export * from './jobs';

// Import all tables for relation definitions
import { relations } from 'drizzle-orm';
import { shows, performances } from './shows';
import { images } from './images';
import { tags, showTags } from './tags';
import { users } from './users';
import { orders, lineItems, tickets, blockedSeats } from './orders';
import { payments } from './payments';
import { coupons, couponPerformances, couponUsages } from './coupons';
import { sponsors } from './sponsors';
import { newsArticles } from './content';
import { siteSettings } from './settings';
import {
  clientApplications,
  applicationDefinedScopes,
  grantedPermissions,
  clientSecrets,
} from './oauth';
import { jobs } from './jobs';

// Define all relations here to avoid circular imports

export const showsRelations = relations(shows, ({ many, one }) => ({
  image: one(images, { fields: [shows.imageId], references: [images.id] }),
  performances: many(performances),
  showTags: many(showTags),
}));

export const performancesRelations = relations(performances, ({ one, many }) => ({
  show: one(shows, { fields: [performances.showId], references: [shows.id] }),
  lineItems: many(lineItems),
  couponPerformances: many(couponPerformances),
}));

export const usersRelations = relations(users, ({ many }) => ({
  lineItems: many(lineItems),
  orders: many(orders),
}));

export const lineItemsRelations = relations(lineItems, ({ one, many }) => ({
  performance: one(performances, {
    fields: [lineItems.performanceId],
    references: [performances.id],
  }),
  user: one(users, { fields: [lineItems.userId], references: [users.id] }),
  order: one(orders, { fields: [lineItems.orderId], references: [orders.id] }),
  tickets: many(tickets),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  lineItems: many(lineItems),
  payments: many(payments),
  couponUsages: many(couponUsages),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  showTags: many(showTags),
}));

export const showTagsRelations = relations(showTags, ({ one }) => ({
  show: one(shows, {
    fields: [showTags.showId],
    references: [shows.id],
  }),
  tag: one(tags, { fields: [showTags.tagId], references: [tags.id] }),
}));

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  logo: one(images, { fields: [sponsors.logoId], references: [images.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponPerformances: many(couponPerformances),
  couponUsages: many(couponUsages),
}));

export const couponPerformancesRelations = relations(couponPerformances, ({ one }) => ({
  coupon: one(coupons, { fields: [couponPerformances.couponId], references: [coupons.id] }),
  performance: one(performances, {
    fields: [couponPerformances.performanceId],
    references: [performances.id],
  }),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsages.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponUsages.orderId], references: [orders.id] }),
  user: one(users, { fields: [couponUsages.userId], references: [users.id] }),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  image: one(images, { fields: [newsArticles.imageId], references: [images.id] }),
}));

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  logo: one(images, { fields: [siteSettings.logoImageId], references: [images.id] }),
  favicon: one(images, { fields: [siteSettings.faviconImageId], references: [images.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  lineItem: one(lineItems, { fields: [tickets.lineItemId], references: [lineItems.id] }),
  performance: one(performances, {
    fields: [tickets.performanceId],
    references: [performances.id],
  }),
  order: one(orders, { fields: [tickets.orderId], references: [orders.id] }),
}));

export const clientApplicationsRelations = relations(clientApplications, ({ many }) => ({
  secrets: many(clientSecrets),
  definedScopes: many(applicationDefinedScopes),
  grantedPermissions: many(grantedPermissions),
}));

export const clientSecretsRelations = relations(clientSecrets, ({ one }) => ({
  application: one(clientApplications, {
    fields: [clientSecrets.clientApplicationId],
    references: [clientApplications.id],
  }),
}));

export const applicationDefinedScopesRelations = relations(
  applicationDefinedScopes,
  ({ one, many }) => ({
    application: one(clientApplications, {
      fields: [applicationDefinedScopes.applicationId],
      references: [clientApplications.id],
    }),
    grantedPermissions: many(grantedPermissions),
  }),
);

export const grantedPermissionsRelations = relations(grantedPermissions, ({ one }) => ({
  grantedToApplication: one(clientApplications, {
    fields: [grantedPermissions.grantedToApplicationId],
    references: [clientApplications.id],
  }),
  definedScope: one(applicationDefinedScopes, {
    fields: [grantedPermissions.definedScopeId],
    references: [applicationDefinedScopes.id],
  }),
}));

export const jobsRelations = relations(jobs, () => ({}));

export const blockedSeatsRelations = relations(blockedSeats, ({ one }) => ({
  performance: one(performances, {
    fields: [blockedSeats.performanceId],
    references: [performances.id],
  }),
  createdBy: one(users, { fields: [blockedSeats.createdBy], references: [users.id] }),
}));

export const imagesRelations = relations(images, ({ many }) => ({
  shows: many(shows),
  sponsors: many(sponsors),
  newsArticles: many(newsArticles),
  siteSettings: many(siteSettings),
}));
