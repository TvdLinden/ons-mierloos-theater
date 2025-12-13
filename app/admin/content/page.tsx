'use server';
import { requireRole } from '@/lib/utils/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllNavigationLinks } from '@/lib/queries/content';
import { NavigationLinksList } from './NavigationLinksList';
import { HomepageContentForm } from './HomepageContentForm';
import { NewsArticlesList } from './NewsArticlesList';
import { SocialMediaLinksList } from './SocialMediaLinksList';
import { PreviewMode } from './PreviewMode';
import { getHomepageContent, getAllNewsArticles } from '@/lib/queries/content';
import { getAllImages } from '@/lib/queries/images';
import { getAllSocialMediaLinks } from '@/lib/queries/socialMedia';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function ContentManagementPage() {
  await requireRole(['admin', 'contributor']);

  const [headerLinks, footerLinks, homepageContent, newsArticles, images, socialMediaLinks] =
    await Promise.all([
      getAllNavigationLinks().then((links) => links.filter((l) => l.location === 'header')),
      getAllNavigationLinks().then((links) => links.filter((l) => l.location === 'footer')),
      getHomepageContent(),
      getAllNewsArticles(),
      getAllImages(),
      getAllSocialMediaLinks(),
    ]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <AdminPageHeader title="Content Beheer" />
          <p className="text-muted-foreground">Beheer de inhoud van header, footer en homepagina</p>
        </div>
        <PreviewMode homepageContent={homepageContent} newsArticles={newsArticles} />
      </div>

      {/* Header Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Header Navigatie</CardTitle>
          <CardDescription>Beheer de links in de hoofdnavigatie</CardDescription>
        </CardHeader>
        <CardContent>
          <NavigationLinksList links={headerLinks} location="header" />
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Navigatie</CardTitle>
          <CardDescription>Beheer de links in de footer</CardDescription>
        </CardHeader>
        <CardContent>
          <NavigationLinksList links={footerLinks} location="footer" />
        </CardContent>
      </Card>

      {/* Homepage Content */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Inhoud</CardTitle>
          <CardDescription>
            Beheer de intro tekst en nieuws artikelen op de homepagina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageContentForm initialData={homepageContent} />
        </CardContent>
      </Card>

      {/* News Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Nieuws Artikelen</CardTitle>
          <CardDescription>Beheer nieuws artikelen voor de homepagina</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsArticlesList articles={newsArticles} availableImages={images} />
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Beheer social media links in de footer</CardDescription>
        </CardHeader>
        <CardContent>
          <SocialMediaLinksList links={socialMediaLinks} />
        </CardContent>
      </Card>
    </div>
  );
}
