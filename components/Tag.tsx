import { Tag as TagType } from '@/lib/db';

export type TagProps = {
  tag: TagType;
  size?: 'sm' | 'md';
  active?: boolean;
  className?: string;
};

export default function Tag({ tag, size = 'md', active = true, className }: TagProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const activeClasses =
    'border-2 border-secondary bg-secondary text-accent font-semibold dark:border-primary dark:bg-primary dark:text-surface';
  const inactiveClasses =
    'border-2 border-transparent bg-transparent text-textSecondary hover:bg-muted dark:border-transparent dark:bg-transparent dark:text-zinc-400';

  return (
    <span
      className={`${sizeClasses[size]} rounded-full transition-colors ${
        active ? activeClasses : inactiveClasses
      } ${className ?? ''}`.trim()}
    >
      {tag.name}
    </span>
  );
}
