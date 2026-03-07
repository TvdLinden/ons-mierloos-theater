'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import type {
  Image as ImageType,
  FocalPoints,
  FocalPointContext,
} from '@ons-mierloos-theater/shared/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';

export type FocalPointEditorHandle = {
  getFocalPoints: () => FocalPoints;
};

const FOCAL_POINT_CONTEXTS = [
  { key: 'hero' as const, label: 'Hero', ratio: 16 / 7 },
  { key: 'card' as const, label: 'Kaart', ratio: 4 / 3 },
  { key: 'carousel' as const, label: 'Carousel', ratio: 21 / 9 },
  { key: 'thumbnail' as const, label: 'Miniatuur', ratio: 4 / 3 },
  { key: 'gallery' as const, label: 'Galerij', ratio: 16 / 9 },
];

type Props = {
  image: ImageType;
  onClose: () => void;
  onSave: (focalPoints: FocalPoints) => Promise<void>;
  isSaving?: boolean;
};

const FocalPointEditor = forwardRef<FocalPointEditorHandle, Props>(
  ({ image, onClose, onSave, isSaving = false }, ref) => {
    const [activeTab, setActiveTab] = useState<FocalPointContext>('hero');
    const [localPoints, setLocalPoints] = useState<FocalPoints>(
      (image.focalPoints as FocalPoints) ?? {},
    );
    const imageRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getFocalPoints: () => localPoints,
    }));

    const getCurrentContext = () =>
      FOCAL_POINT_CONTEXTS.find((c) => c.key === activeTab) || FOCAL_POINT_CONTEXTS[0];

    const handleImageClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        setLocalPoints((prev) => ({
          ...prev,
          [activeTab]: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
        }));
      },
      [activeTab],
    );

    const currentFocalPoint = localPoints[activeTab];
    const context = getCurrentContext();
    const previewDim = {
      width: 300,
      height: 300 / context.ratio,
    };

    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as FocalPointContext)}>
          <TabsList className="grid w-full grid-cols-5">
            {FOCAL_POINT_CONTEXTS.map((ctx) => (
              <TabsTrigger key={ctx.key} value={ctx.key} className="text-xs">
                {ctx.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {FOCAL_POINT_CONTEXTS.map((ctx) => (
            <TabsContent key={ctx.key} value={ctx.key} className="grid grid-cols-3 gap-4 mt-4">
              {/* Image with clickable area (2/3 width) */}
              <div className="col-span-2">
                <div
                  ref={imageRef}
                  className="relative w-full bg-muted cursor-crosshair overflow-hidden rounded border"
                  style={{
                    aspectRatio: `${image.originalWidth ?? 1} / ${image.originalHeight ?? 1}`,
                  }}
                  onClick={handleImageClick}
                >
                  <Image
                    src={getImageUrl(image.id)}
                    alt={image.filename || 'Afbeelding'}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />

                  {/* Overlay - darkens everything except crop area */}
                  {currentFocalPoint && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.45)',
                      }}
                    />
                  )}

                  {/* Crosshair dot */}
                  {currentFocalPoint && (
                    <div
                      className="absolute w-3 h-3 bg-yellow-400 rounded-full pointer-events-none border border-yellow-300"
                      style={{
                        left: `${currentFocalPoint.x}%`,
                        top: `${currentFocalPoint.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentFocalPoint
                    ? `X: ${currentFocalPoint.x.toFixed(1)}% • Y: ${currentFocalPoint.y.toFixed(1)}%`
                    : 'Klik op de afbeelding om focuspunt in te stellen'}
                </p>
              </div>

              {/* Live preview (1/3 width) */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{ctx.label} voorvertoning</p>
                <div
                  className="border-2 border-primary/50 rounded bg-muted overflow-hidden"
                  style={{
                    width: previewDim.width,
                    height: previewDim.height,
                    backgroundImage: `url('${getImageUrl(image.id)}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: currentFocalPoint
                      ? `${currentFocalPoint.x}% ${currentFocalPoint.y}%`
                      : '50% 50%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <p className="text-xs text-muted-foreground text-center">
                  {ctx.ratio.toFixed(2)}:1
                  {currentFocalPoint && (
                    <>
                      <br />
                      <span className="text-primary/70">
                        ({currentFocalPoint.x.toFixed(0)}%, {currentFocalPoint.y.toFixed(0)}%)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  },
);

FocalPointEditor.displayName = 'FocalPointEditor';

export default FocalPointEditor;
