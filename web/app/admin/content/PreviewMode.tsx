'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import Markdown from '@/components/ui/markdown';
import type { HomepageContent, NewsArticle } from '@ons-mierloos-theater/shared/db';
import Image from 'next/image';

interface PreviewModeProps {
  homepageContent: HomepageContent | null;
  newsArticles: NewsArticle[];
}

export function PreviewMode({ homepageContent, newsArticles }: PreviewModeProps) {
  const [open, setOpen] = useState(false);

  const activeArticles = newsArticles.filter((article) => article.active === 1).slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Voorbeeld
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Homepage Voorbeeld</DialogTitle>
          <DialogDescription>Zo zal de homepage eruitzien met de huidige content</DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Homepage Intro */}
          {homepageContent && (
            <div className="space-y-4">
              {homepageContent.introTitle && (
                <h1 className="text-4xl font-bold">{homepageContent.introTitle}</h1>
              )}
              {homepageContent.introText && (
                <div className="prose max-w-none">
                  <Markdown content={homepageContent.introText} />
                </div>
              )}
            </div>
          )}

          {/* News Articles Preview */}
          {activeArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Nieuws</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeArticles.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4 space-y-3">
                    {article.imageId && (
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        <Image
                          src={`/api/images/${article.imageId}`}
                          alt={article.title}
                          className="object-cover w-full h-full"
                          fill
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{article.title}</h3>
                    <div className="prose prose-sm max-w-none line-clamp-3">
                      <Markdown content={article.content} />
                    </div>
                    {article.publishedAt && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!homepageContent && activeArticles.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Geen content om te tonen in het voorbeeld
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
