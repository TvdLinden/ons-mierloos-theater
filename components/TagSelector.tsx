import { Tag } from '@/lib/db';
import ToggleButtonGroup, { type ToggleOption } from './ToggleButtonGroup';

type TagSelectorProps = {
  availableTags: Tag[];
  selectedTagIds?: string[];
  name?: string;
};

export default function TagSelector({
  availableTags,
  selectedTagIds = [],
  name = 'tagIds',
}: TagSelectorProps) {
  const options: ToggleOption[] = availableTags.map((tag) => ({
    id: tag.id,
    tag: tag,
  }));

  return (
    <ToggleButtonGroup options={options} selectedIds={selectedTagIds} name={name} multiple={true} />
  );
}
