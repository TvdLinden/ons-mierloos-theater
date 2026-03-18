'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  deleteImageAction,
  pruneImagesAction,
  updateImageFocalPointsAction,
} from './actions';
import { ImageUploadZone } from './ImageUploadZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertCircle, Eraser, Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import FocalPointEditor, { type FocalPointEditorHandle } from '@/components/FocalPointEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
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
import { Image as ImageType } from '@ons-mierloos-theater/shared/db';

type ImageManagementClientProps = {
  images: Omit<ImageType, 'imageLg' | 'imageMd' | 'imageSm'>[];
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
  const [editingImage, setEditingImage] = useState<(typeof images)[number] | null>(null);
  const [savingFocalPoints, setSavingFocalPoints] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const focalPointEditorRef = useRef<FocalPointEditorHandle>(null);

  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  };

  const getFocalPointsDisplay = (
    focalPoints: Record<string, { x: number; y: number }> | null | undefined,
  ) => {
    if (!focalPoints || Object.keys(focalPoints).length === 0) {
      return null;
    }
    const contexts = Object.keys(focalPoints).sort();
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {contexts.map((ctx) => (
          <span
            key={ctx}
            className="inline-block px-2 py-0.5 text-xs rounded bg-primary/20 text-primary"
          >
            {ctx}
          </span>
        ))}
      </div>
    );
  };

  const handleSaveFocalPoints = async () => {
    if (!editingImage || !focalPointEditorRef.current) return;

    setSavingFocalPoints(true);
    try {
      const focalPoints = focalPointEditorRef.current.getFocalPoints();
      const result = await updateImageFocalPointsAction(editingImage.id, focalPoints);
      if (result.success) {
        setEditingImage(null);
        startTransition(() => {
          router.refresh();
        });
      }
    } finally {
      setSavingFocalPoints(false);
    }
  };

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
      <ImageUploadZone onUploadComplete={() => startTransition(() => router.refresh())} />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Prune Success Message */}
      {pruneMessage && (
        <Alert variant="success">
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
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedImages.size === images.length && images.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Alles selecteren
                </label>
              </div>
              {selectedImages.size > 0 && (
                <p className="text-sm text-muted-foreground">{selectedImages.size} geselecteerd</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className={`overflow-hidden transition-all ${
                    selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={`/api/images/${image.id}?size=sm`}
                        alt={image.filename || 'Afbeelding'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                        style={getFocalPointStyle(image.focalPoints as any, '4:3')}
                      />
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1.5">
                        <Checkbox
                          checked={selectedImages.has(image.id)}
                          onCheckedChange={() => toggleImageSelection(image.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
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
                      {getFocalPointsDisplay(image.focalPoints as any)}
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setEditingImage(image)}
                          disabled={isPending}
                        >
                          <Settings2 className="mr-2 h-4 w-4" />
                          Focuspunten
                        </Button>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
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

      {/* Focal Point Editor Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Focuspunten bewerken</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {editingImage && (
              <FocalPointEditor
                ref={focalPointEditorRef}
                image={editingImage}
                onClose={() => {
                  setEditingImage(null);
                  startTransition(() => {
                    router.refresh();
                  });
                }}
                onSave={async () => {
                  // onSave is not used anymore, but kept for type compatibility
                }}
                isSaving={savingFocalPoints}
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingImage(null)}
              disabled={savingFocalPoints}
            >
              Annuleren
            </Button>
            <Button onClick={handleSaveFocalPoints} disabled={savingFocalPoints}>
              {savingFocalPoints ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
