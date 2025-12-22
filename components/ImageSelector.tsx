'use client';

import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';

interface ImageSelectorProps {
  label: string;
  selectedImageId: string | null;
  availableImages: Array<{ id: string; filename: string | null }>;
  onSelect: (imageId: string | null) => void;
  imageSize?: 'small' | 'medium' | 'large';
  imagesPerPage?: number;
}

export function ImageSelector({
  label,
  selectedImageId,
  availableImages,
  onSelect,
  imageSize = 'medium',
  imagesPerPage = 12,
}: ImageSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const sizeMap = {
    small: { container: 'w-16 h-16', grid: 'grid-cols-3' },
    medium: { container: 'w-32 h-32', grid: 'grid-cols-4' },
    large: { container: 'w-48 h-48', grid: 'grid-cols-5' },
  };
  const { container, grid } = sizeMap[imageSize];
  const {
    offset,
    setOffset,
    totalPages,
    nextPage: handleNextPage,
    prevPage: handlePrevPage,
    reset: resetPage,
  } = usePagination(availableImages.length, imagesPerPage);

  const currentPage = Math.floor(offset / imagesPerPage);
  const setCurrentPage = (page: number) => setOffset(page * imagesPerPage);
  const displayedImages = availableImages.slice(offset, offset + imagesPerPage);

  const handleOpenPicker = () => {
    resetPage();
    setShowPicker(true);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {selectedImageId ? (
        <div className="relative inline-block mt-2">
          <div className={`relative ${container} border rounded overflow-hidden`}>
            <Image
              src={`/api/images/${selectedImageId}`}
              alt={label}
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleOpenPicker}
          >
            Wijzigen
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={handleOpenPicker}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Selecteer Afbeelding
        </Button>
      )}

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecteer een afbeelding</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className={`grid ${grid} gap-2 pb-4`}>
              {displayedImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={`relative aspect-square border-2 rounded transition-colors ${
                    selectedImageId === img.id
                      ? 'border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                  onClick={() => {
                    onSelect(img.id);
                  }}
                >
                  <Image
                    src={`/api/images/${img.id}`}
                    alt={img.filename || 'Afbeelding'}
                    fill
                    className="object-cover rounded"
                    sizes="100px"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4 justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePrevPage();
                    }}
                    className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNextPage();
                    }}
                    className={
                      currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowPicker(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
