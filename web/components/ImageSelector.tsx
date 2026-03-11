'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import type { Image as ImageType, FocalPointContext } from '@ons-mierloos-theater/shared/db';

const PAGE_SIZE = 48;

type SingleProps = {
  mode?: 'single';
  selectedImageId: string | null;
  onSelect: (imageId: string | null) => void;
  selectedImageIds?: never;
  maxImages?: never;
};

type MultiProps = {
  mode: 'multi';
  selectedImageIds: string[];
  onSelect: (imageIds: string[]) => void;
  selectedImageId?: never;
  maxImages?: number;
};

type ImageSelectorProps = (SingleProps | MultiProps) & {
  label: string;
  focalPointContext?: FocalPointContext;
};

export function ImageSelector({
  label,
  focalPointContext = '4:3' as FocalPointContext,
  ...props
}: ImageSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [availableImages, setAvailableImages] = useState<Partial<ImageType>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isMulti = props.mode === 'multi';
  const selectedIds: string[] = isMulti ? props.selectedImageIds : props.selectedImageId ? [props.selectedImageId] : [];
  const maxImages = isMulti ? (props.maxImages ?? Infinity) : 1;

  const fetchImages = async (offset: number) => {
    if (offset === 0) setIsLoading(true);
    else setIsFetchingMore(true);
    try {
      const response = await fetch(`/api/images?limit=${PAGE_SIZE}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableImages((prev) => offset === 0 ? data.images : [...prev, ...data.images]);
        setHasMore(data.hasMore);
        offsetRef.current = offset + data.images.length;
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          fetchImages(offsetRef.current);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, showPicker]);

  const handleOpenPicker = () => {
    if (availableImages.length === 0) fetchImages(0);
    setShowPicker(true);
  };

  const handleToggle = (imageId: string) => {
    if (isMulti) {
      const current = props.selectedImageIds;
      const next = current.includes(imageId)
        ? current.filter((id) => id !== imageId)
        : current.length < maxImages
          ? [...current, imageId]
          : current;
      props.onSelect(next);
    } else {
      props.onSelect(imageId);
      setShowPicker(false);
    }
  };

  const handleRemove = (imageId: string) => {
    if (isMulti) {
      props.onSelect(props.selectedImageIds.filter((id) => id !== imageId));
    } else {
      props.onSelect(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Trigger area */}
      {isMulti ? (
        <div className="space-y-2">
          <Button type="button" variant="outline" onClick={handleOpenPicker} className="w-full">
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecteer afbeeldingen ({selectedIds.length}/{maxImages === Infinity ? '∞' : maxImages})
          </Button>
          {selectedIds.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {selectedIds.map((id) => {
                const img = availableImages.find((i) => i.id === id);
                return (
                  <div key={id} className="relative group">
                    <div className="relative w-full aspect-square">
                      <Image
                        src={`/api/images/${id}`}
                        alt="Geselecteerde afbeelding"
                        fill
                        className="object-cover rounded"
                        sizes="80px"
                        style={getFocalPointStyle(img?.focalPoints as any, focalPointContext)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Verwijder afbeelding"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        props.selectedImageId ? (
          <div className="relative inline-block mt-2">
            <div className="relative w-32 h-32 border rounded overflow-hidden">
              <Image
                src={`/api/images/${props.selectedImageId}`}
                alt={label}
                fill
                className="object-cover"
                sizes="128px"
                style={getFocalPointStyle(
                  availableImages.find((img) => img.id === props.selectedImageId)?.focalPoints as any,
                  focalPointContext,
                )}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2"
              onClick={() => handleRemove(props.selectedImageId!)}
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
        )
      )}

      {/* Picker dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isMulti ? 'Selecteer afbeeldingen' : 'Selecteer een afbeelding'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Laden...</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 pb-4">
                  {availableImages.map((img) => {
                    const isSelected = selectedIds.includes(img.id!);
                    const canSelect = !isMulti || isSelected || selectedIds.length < maxImages;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => canSelect && handleToggle(img.id!)}
                        disabled={!canSelect}
                        className={`relative aspect-square border-2 rounded transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary'
                            : canSelect
                              ? 'border-border hover:border-primary'
                              : 'border-border opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Image
                          src={`/api/images/${img.id}`}
                          alt={img.filename || 'Afbeelding'}
                          fill
                          className="object-cover rounded"
                          sizes="120px"
                          loading="lazy"
                          style={getFocalPointStyle(img.focalPoints as any, focalPointContext)}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div ref={sentinelRef} className="h-1" />
                {isFetchingMore && (
                  <p className="text-sm text-muted-foreground text-center py-4">Laden...</p>
                )}
                {!hasMore && availableImages.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Alle afbeeldingen geladen</p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowPicker(false)}>
              {isMulti ? 'Klaar' : 'Sluiten'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
