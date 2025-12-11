'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { deleteImageAction, uploadImageAction, pruneImagesAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Upload, AlertCircle, Eraser } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Image as ImageType } from '@/lib/queries/images';

type ImageManagementClientProps = {
  images: ImageType[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export default function ImageManagementClient({
  images,
  currentPage,
  totalPages,
  totalCount,
}: ImageManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pruning, setPruning] = useState(false);
  const [pruneMessage, setPruneMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pruneDialogOpen, setPruneDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const [uploadState, uploadAction, uploadPending] = useActionState(uploadImageAction, undefined);

  const handleDelete = async (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setDeletingId(imageToDelete);
    setError(null);
    setDeleteDialogOpen(false);

    const result = await deleteImageAction(imageToDelete);

    if (!result.success) {
      setError(result.error || 'Fout bij verwijderen');
      setDeletingId(null);
      setImageToDelete(null);
      return;
    }

    startTransition(() => {
      router.refresh();
      setDeletingId(null);
      setImageToDelete(null);
    });
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/admin/images?page=${newPage}`);
  };

  const handlePrune = async () => {
    setPruneDialogOpen(true);
  };

  const confirmPrune = async () => {
    setPruning(true);
    setPruneMessage(null);
    setError(null);
    setPruneDialogOpen(false);

    const result = await pruneImagesAction();

    if (!result.success) {
      setError(result.error || 'Fout bij opschonen');
    } else {
      setPruneMessage(result.message || 'Afbeeldingen opgeschoond');
      startTransition(() => {
        router.refresh();
      });
    }

    setPruning(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardContent className="pt-6">
          <form action={uploadAction} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="image" className="block text-sm font-medium mb-2">
                Nieuwe afbeelding uploaden
              </label>
              <Input id="image" name="image" type="file" accept="image/*" required />
            </div>
            <Button type="submit" disabled={uploadPending}>
              <Upload className="mr-2 h-4 w-4" />
              {uploadPending ? 'Uploaden...' : 'Upload'}
            </Button>
          </form>
          {uploadState?.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadState.error}</AlertDescription>
            </Alert>
          )}
          {uploadState?.success && (
            <Alert className="mt-4">
              <AlertDescription>Afbeelding succesvol geüpload!</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Prune Success Message */}
      {pruneMessage && (
        <Alert>
          <AlertDescription>{pruneMessage}</AlertDescription>
        </Alert>
      )}

      {/* Prune Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={handlePrune}
            disabled={pruning || isPending}
            className="w-full"
          >
            <Eraser className="mr-2 h-4 w-4" />
            {pruning ? 'Bezig met opschonen...' : 'Ongebruikte Afbeeldingen Verwijderen'}
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Verwijdert afbeeldingen die niet gekoppeld zijn aan voorstellingen of sponsors.
          </p>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Totaal {totalCount} afbeelding{totalCount !== 1 ? 'en' : ''}
          </p>
        </div>

        {images.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Geen afbeeldingen gevonden.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={`/api/images/${image.id}`}
                      alt={image.filename || 'Afbeelding'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={image.filename || ''}
                    >
                      {image.filename || 'Geen naam'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.uploadedAt
                        ? new Date(image.uploadedAt).toLocaleDateString('nl-NL')
                        : 'Onbekend'}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDelete(image.id)}
                      disabled={deletingId === image.id || isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === image.id ? 'Verwijderen...' : 'Verwijder'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/admin/images?page=${currentPage - 1}`}
                onClick={(e) => {
                  if (currentPage <= 1 || isPending) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={currentPage <= 1 || isPending ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {/* First page */}
            {currentPage > 2 && (
              <PaginationItem>
                <PaginationLink
                  href={`/admin/images?page=1`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Ellipsis before */}
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Previous page */}
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationLink
                  href={`/admin/images?page=${currentPage - 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Current page */}
            <PaginationItem>
              <PaginationLink
                href={`/admin/images?page=${currentPage}`}
                isActive
                onClick={(e) => e.preventDefault()}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>

            {/* Next page */}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href={`/admin/images?page=${currentPage + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                >
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Ellipsis after */}
            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Last page */}
            {currentPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  href={`/admin/images?page=${totalPages}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href={`/admin/images?page=${currentPage + 1}`}
                onClick={(e) => {
                  if (currentPage >= totalPages || isPending) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={
                  currentPage >= totalPages || isPending ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afbeelding verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze afbeelding wilt verwijderen? Deze actie kan niet ongedaan
              worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prune Confirmation Dialog */}
      <AlertDialog open={pruneDialogOpen} onOpenChange={setPruneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ongebruikte afbeeldingen verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je alle ongebruikte afbeeldingen wilt verwijderen? Deze actie
              verwijdert alle afbeeldingen die niet gekoppeld zijn aan voorstellingen of sponsors.
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPrune}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
