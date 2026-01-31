import { Suspense } from 'react';
import { getAllImages, getImagesCount } from '@/lib/queries/images';
import ImageManagementClient from './ImageManagementClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const ITEMS_PER_PAGE = 20;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const [images, totalCount] = await Promise.all([
    getAllImages(offset, ITEMS_PER_PAGE),
    getImagesCount(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto py-8 px-4">
      <AdminPageHeader title="" />
      <Card>
        <CardHeader>
          <CardTitle>Afbeeldingenbeheer</CardTitle>
          <CardDescription>
            Beheer alle afbeeldingen in het systeem. Upload nieuwe afbeeldingen of verwijder
            ongebruikte afbeeldingen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Laden...</div>}>
            <ImageManagementClient
              images={images}
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
