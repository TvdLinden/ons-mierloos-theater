import { requireRole } from '@/lib/utils/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSiteSettings, getSeoSettings } from '@/lib/queries/settings';
import { getAllImages } from '@/lib/queries/images';
import { SiteSettingsForm } from './SiteSettingsForm';
import { SeoSettingsForm } from './SeoSettingsForm';

export default async function SettingsPage() {
  await requireRole(['admin']);

  const [siteSettings, seoSettings, images] = await Promise.all([
    getSiteSettings(),
    getSeoSettings(),
    getAllImages(),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Instellingen</h1>
        <p className="text-muted-foreground">Beheer algemene site instellingen, SEO en metadata</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="general">Algemeen</TabsTrigger>
          <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Algemene Instellingen</CardTitle>
              <CardDescription>Beheer site naam, contactgegevens, logo en kleuren</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteSettingsForm initialData={siteSettings} availableImages={images} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Metadata Instellingen</CardTitle>
              <CardDescription>
                Beheer standaard SEO tags, Open Graph en Twitter Cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeoSettingsForm initialData={seoSettings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
