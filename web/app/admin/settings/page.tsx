import { requireRole } from '@/lib/utils/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getSiteSettings,
  getSeoSettings,
  getAllCustomCodeSnippets,
} from '@ons-mierloos-theater/shared/queries/settings';
import { getAllImages } from '@ons-mierloos-theater/shared/queries/images';
import { SiteSettingsForm } from './SiteSettingsForm';
import { SeoSettingsForm } from './SeoSettingsForm';
import { CustomCodeForm } from './CustomCodeForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function SettingsPage() {
  await requireRole(['admin']);

  const [siteSettings, seoSettings, images, snippets] = await Promise.all([
    getSiteSettings(),
    getSeoSettings(),
    getAllImages(0, 1000),
    getAllCustomCodeSnippets(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Site Instellingen"
        subtitle="Beheer algemene site instellingen, SEO en metadata"
        breadcrumbs={[{ label: 'Instellingen' }]}
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="general">Algemeen</TabsTrigger>
          <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
          <TabsTrigger value="code">Code Injectie</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Algemene Instellingen</CardTitle>
              <CardDescription>Beheer site naam, contactgegevens en logo</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteSettingsForm initialData={siteSettings} />
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

        <TabsContent value="code" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Injectie</CardTitle>
              <CardDescription>
                Voeg aangepaste HTML-snippets toe aan de pagina (bijv. GTM, widgets, custom CSS).
                Snippets worden geïnjecteerd in &lt;head&gt;, aan het begin of aan het einde van
                &lt;body&gt;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomCodeForm initialSnippets={snippets} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
