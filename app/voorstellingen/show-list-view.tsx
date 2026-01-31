'use client';

import React from 'react';

import Image from 'next/image';
import DateDisplay from '@/components/DateDisplay';
import Link from 'next/link';
import type { ShowWithTagsAndPerformances, Tag } from '@/lib/db';
import { getShowThumbnailUrl } from '@/lib/utils/performanceImages';
import TagsContainer from '@/components/TagsContainer';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type PerformanceListItemProps = {
  show: ShowWithTagsAndPerformances;
  tags?: Tag[];
  href?: string;
};

export default function PerformanceListItem({ show, href }: PerformanceListItemProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const { title, subtitle, slug, tags, performances, basePrice } = show;
  const imageUrl = getShowThumbnailUrl(show);

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

  return (
    <Link href={href || `/performances/${slug}`} className="group block w-full">
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
        {/* Image */}
        <div className="relative w-full md:w-48 aspect-4/3 rounded-md overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl || '/placeholder.svg'}
            alt={title || 'Show'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 192px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{subtitle}</p>
              )}
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-muted-foreground">vanaf</p>
              <p className="text-lg font-semibold">
                <span className="text-xs">€</span>
                {basePrice || '—'}
              </p>
            </div>
          </div>

          {/* Date & Status */}
          <div className="flex items-center gap-3 mb-3">
            {dateDisplay && (
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
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                availablePerformances && availablePerformances.length > 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {availablePerformances && availablePerformances.length > 0
                ? 'Beschikbaar'
                : 'Uitverkocht'}
            </span>
          </div>

          {/* Tags (always visible) */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <TagsContainer tags={tags} />
            </div>
          )}

          {/* Expandable Details Toggle */}
          <div className="mt-auto">
            <button
              onClick={toggleInfo}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{infoVisible ? 'Minder details' : 'Meer details'}</span>
              <ChevronDown
                className={`size-4 transition-transform duration-300 ${infoVisible ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable Content */}
            {infoVisible && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="space-y-2">
                  {availablePerformances && availablePerformances.length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">
                        Alle voorstellingen
                      </p>
                      <div className="space-y-1">
                        {availablePerformances.slice(0, 5).map((perf) => (
                          <p key={perf.id} className="text-sm text-muted-foreground">
                            <DateDisplay
                              value={new Date(perf.date)}
                              options={{ dateStyle: 'medium', timeStyle: 'short' }}
                            />
                          </p>
                        ))}
                        {availablePerformances.length > 5 && (
                          <p className="text-sm text-muted-foreground italic">
                            +{availablePerformances.length - 5} meer...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center md:items-start md:self-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = href || `/performances/${slug}`;
            }}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Details
          </button>
        </div>
      </div>
    </Link>
  );
}
