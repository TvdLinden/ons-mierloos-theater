import { Tag as TagType } from '@ons-mierloos-theater/shared/db';
import Tag from './Tag';

export type TagsContainerProps = {
  tags?: TagType[];
  size?: 'sm' | 'md';
};

export default function TagsContainer({ tags, size = 'md' }: TagsContainerProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <Tag key={tag.id} tag={tag} size={size} />
      ))}
    </div>
  );
}
