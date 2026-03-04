import { db } from '../db';
import { siteSettings, seoSettings, customCodeSnippets } from '../db/schema';
import { eq, asc, and } from 'drizzle-orm';
import type { CustomCodeSnippet } from '../db';

export interface SiteSettings {
  id?: string;
  siteName: string | null;
  siteDescription: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  logoImageId: string | null;
  faviconImageId: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontDisplay: string | null;
  fontBody: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
}

export interface SeoSettings {
  id?: string;
  defaultTitle: string | null;
  defaultDescription: string | null;
  defaultKeywords: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterSite: string | null;
}

function removeUndefined<T extends Record<string, any>>(obj: Partial<T>) {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj)) {
    const val = (obj as any)[k];
    if (val !== undefined) out[k as keyof T] = val;
  }
  return out;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(siteSettings).limit(1);
  if (rows.length === 0) {
    return {
      siteName: 'Ons Mierloos Theater',
      siteDescription: null,
      contactEmail: null,
      contactPhone: null,
      contactAddress: null,
      logoImageId: null,
      faviconImageId: null,
      primaryColor: null,
      secondaryColor: null,
      fontDisplay: null,
      fontBody: null,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
    };
  }
  return rows[0] as SiteSettings;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const rows = await db.select().from(seoSettings).limit(1);
  if (rows.length === 0) {
    return {
      defaultTitle: 'Ons Mierloos Theater',
      defaultDescription: null,
      defaultKeywords: null,
      ogImage: null,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterSite: null,
    };
  }
  return rows[0] as SeoSettings;
}

export async function updateSiteSettings(settings: Partial<SiteSettings>) {
  const existing = await db.select().from(siteSettings).limit(1);

  const payload = removeUndefined<SiteSettings>(settings);
  // always set updatedAt
  (payload as any).updatedAt = new Date();

  if (existing.length === 0) {
    // Insert a new row, allow DB defaults (id/default timestamps)
    await db.insert(siteSettings).values(payload as any);
  } else {
    await db
      .update(siteSettings)
      .set(payload as any)
      .where(eq(siteSettings.id, existing[0].id));
  }
}

export async function updateSeoSettings(settings: Partial<SeoSettings>) {
  const existing = await db.select().from(seoSettings).limit(1);

  const payload = removeUndefined<SeoSettings>(settings);
  (payload as any).updatedAt = new Date();

  if (existing.length === 0) {
    await db.insert(seoSettings).values(payload as any);
  } else {
    await db
      .update(seoSettings)
      .set(payload as any)
      .where(eq(seoSettings.id, existing[0].id));
  }
}

// --- Custom Code Snippets ---

export async function getAllCustomCodeSnippets(): Promise<CustomCodeSnippet[]> {
  return db
    .select()
    .from(customCodeSnippets)
    .orderBy(asc(customCodeSnippets.sortOrder), asc(customCodeSnippets.createdAt));
}

export async function getEnabledSnippetsByLocation(location: string): Promise<CustomCodeSnippet[]> {
  return db
    .select()
    .from(customCodeSnippets)
    .where(and(eq(customCodeSnippets.isEnabled, true), eq(customCodeSnippets.location, location)))
    .orderBy(asc(customCodeSnippets.sortOrder), asc(customCodeSnippets.createdAt));
}

export interface CustomCodeSnippetData {
  name: string;
  location: string;
  html: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export async function createCustomCodeSnippet(
  data: CustomCodeSnippetData,
): Promise<CustomCodeSnippet> {
  const rows = await db
    .insert(customCodeSnippets)
    .values({
      name: data.name,
      location: data.location,
      html: data.html,
      isEnabled: data.isEnabled ?? true,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();
  return rows[0];
}

export async function updateCustomCodeSnippet(
  id: string,
  data: Partial<CustomCodeSnippetData>,
): Promise<CustomCodeSnippet> {
  const payload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  const rows = await db
    .update(customCodeSnippets)
    .set(payload)
    .where(eq(customCodeSnippets.id, id))
    .returning();
  return rows[0];
}

export async function deleteCustomCodeSnippet(id: string): Promise<void> {
  await db.delete(customCodeSnippets).where(eq(customCodeSnippets.id, id));
}
