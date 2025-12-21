'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { YoutubeBlock } from '@/lib/schemas/blocks';

interface YoutubeBlockComponentProps {
  block: YoutubeBlock;
  mode: 'edit' | 'display';
  onChange?: (data: Partial<YoutubeBlock>) => void;
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export function YoutubeBlockComponent({ block, mode, onChange }: YoutubeBlockComponentProps) {
  const embedUrl = getYoutubeEmbedUrl(block.url);

  if (mode === 'display') {
    if (!embedUrl) return null;

    return (
      <div className="my-8">
        <div className="relative w-full aspect-video">
          <iframe
            src={embedUrl}
            title={block.title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        {block.title && (
          <p className="text-center text-sm text-muted-foreground mt-2">{block.title}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-url`}>YouTube URL</Label>
        <Input
          id={`block-${block.id}-url`}
          type="url"
          value={block.url}
          onChange={(e) => onChange?.({ url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-title`}>Titel (optioneel)</Label>
        <Input
          id={`block-${block.id}-title`}
          value={block.title || ''}
          onChange={(e) => onChange?.({ title: e.target.value })}
          placeholder="Voer een titel in..."
        />
      </div>

      {embedUrl && (
        <div className="border rounded p-2">
          <p className="text-sm font-medium mb-2">Voorbeeld:</p>
          <div className="relative w-full aspect-video">
            <iframe
              src={embedUrl}
              title={block.title || 'YouTube video preview'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
