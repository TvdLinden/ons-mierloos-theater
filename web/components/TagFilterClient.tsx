'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tag } from '@ons-mierloos-theater/shared/db';

type TagFilterClientProps = {
  tags: Tag[];
  selectedTags: string[]; // slugs
};

export default function TagFilterClient({ tags, selectedTags }: TagFilterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Convert selected tag slugs to IDs
  const selectedTagIds = tags.filter((tag) => selectedTags.includes(tag.slug)).map((tag) => tag.id);

  const handleTagChange = (newTagIds: string[]) => {
    const params = new URLSearchParams(searchParams);

    if (newTagIds.length === 0) {
      // Clear tags filter, reset to first page
      params.delete('tags');
      params.delete('page');
    } else {
      // Convert IDs back to slugs for URL
      const newSlugs = newTagIds
        .map((id) => tags.find((tag) => tag.id === id)?.slug)
        .filter(Boolean);

      params.set('tags', newSlugs.join(','));
      params.delete('page'); // Reset to first page when filtering changes
    }

    const newUrl =
      newTagIds.length === 0 ? '/voorstellingen' : `/voorstellingen?${params.toString()}`;

    router.push(newUrl);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => handleTagChange([])}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedTagIds.length === 0
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Alle
      </button>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          const newTagIds = isSelected
            ? selectedTagIds.filter((id) => id !== tag.id)
            : [...selectedTagIds, tag.id];

          return (
            <button
              key={tag.id}
              onClick={() => handleTagChange(newTagIds)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
