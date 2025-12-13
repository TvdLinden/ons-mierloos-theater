'use client';

import Image from 'next/image';
import DateDisplay from '@/components/DateDisplay';
import Link from 'next/link';
import { ShowWithTagsAndPerformances, Tag } from '@/lib/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import TagsContainer from './TagsContainer';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PerformanceCardProps = {
  show: ShowWithTagsAndPerformances;
  tags?: Tag[];
  href?: string;
};

export default function PerformanceCard({ show, href }: PerformanceCardProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [maxHeight, setMaxHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { title, subtitle, slug, tags, performances, basePrice } = show;
  const imageUrl = getShowImageUrl(show, 'md');

  // Get available (published) performances sorted by date
  const availablePerformances = performances
    ?.filter((p) => p.status === 'published' && p.availableSeats > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dateDisplay =
    availablePerformances && availablePerformances.length > 0
      ? availablePerformances.length === 1
        ? new Date(availablePerformances[0].date)
        : `${availablePerformances.length} beschikbare voorstellingen`
      : null;
  const toggleInfo = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInfoVisible(!infoVisible);
  };

  useEffect(() => {
    if (infoVisible && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [infoVisible]);

  return (
    <Link href={href || `/performances/${slug}`} className="group w-full max-w-lg cursor-pointer">
      <div className="relative flex flex-col">
        <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={title || 'Show'}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info Panel */}
        <div
          className={cn(
            'absolute inset-x-2 bottom-2 rounded-md backdrop-blur-sm transition-all duration-300 flex flex-col',
            infoVisible ? 'bg-surface/90 dark:bg-accent/90' : 'bg-surface/50 dark:bg-accent/50',
          )}
          style={{
            maxHeight: 'calc(100% - 1rem)',
          }}
        >
          {/* Header / Toggle */}
          <div
            className={cn(
              'flex items-start justify-between transition-all duration-300',
              infoVisible ? 'rounded-t-md px-3 py-2' : 'rounded-md px-3 py-2',
              'hover:bg-surface/70 dark:hover:bg-accent/70',
            )}
            role="button"
            tabIndex={0}
            onClick={toggleInfo}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleInfo(e);
            }}
          >
            <div>
              <p
                className={`font-semibold transition-all duration-300 line-clamp-1 ${
                  infoVisible ? 'text-lg' : 'text-base'
                }`}
              >
                {title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="text-xs">€</span>
                <span
                  className={`font-semibold transition-all duration-300 ${
                    infoVisible ? 'text-lg' : 'text-base'
                  }`}
                >
                  {basePrice || '—'}
                </span>
              </p>
            </div>

            <div className="bg-background dark:bg-primary mt-1 rounded-full p-1">
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform duration-300 ${
                  infoVisible ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Expandable Content */}
          <div
            ref={contentRef}
            className="overflow-hidden transition-all duration-300 flex-1 min-h-0"
            style={{
              maxHeight: infoVisible ? maxHeight : 0,
              opacity: infoVisible ? 1 : 0,
              visibility: infoVisible ? 'visible' : 'hidden',
            }}
          >
            <div className="p-3 pt-2 border-t border-border dark:border-primary/20 overflow-y-auto h-full">
              {subtitle && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              )}

              {/* Dates */}
              {dateDisplay && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Datums</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof dateDisplay === 'string' ? (
                      dateDisplay
                    ) : (
                      <DateDisplay
                        value={dateDisplay}
                        options={{ dateStyle: 'medium', timeStyle: 'short' }}
                      />
                    )}
                  </p>
                </div>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="mb-3 hidden sm:block">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Categorieën</p>
                  <div className="flex flex-wrap gap-1.5">
                    <TagsContainer tags={tags} />
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border dark:border-primary/20">
                <p className="text-xs text-muted-foreground">
                  {availablePerformances && availablePerformances.length > 0
                    ? 'Beschikbaar'
                    : 'Uitverkocht'}
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = href || `/performances/${slug}`;
                  }}
                  className="bg-primary text-primary-foreground flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Naar voorstelling
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
