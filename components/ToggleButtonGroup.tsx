'use client';

import { useState } from 'react';
import { Tag as TagType } from '@/lib/db';
import Tag from './Tag';

export type ToggleOption = {
  id: string;
  label?: string;
  tag?: TagType;
};

type ToggleButtonGroupProps = {
  options: ToggleOption[];
  selectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  name?: string;
  multiple?: boolean;
};

export default function ToggleButtonGroup({
  options,
  selectedIds = [],
  onChange,
  name,
  multiple = true,
}: ToggleButtonGroupProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selected);

    if (multiple) {
      // Multi-select: toggle on/off
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
    } else {
      // Single-select: replace selection
      newSelected.clear();
      if (!selected.has(optionId)) {
        newSelected.add(optionId);
      }
    }

    setSelected(newSelected);
    onChange?.(Array.from(newSelected));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className={`flex items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70
                  ${option.tag ? 'p-0 border-transparent hover:border-primary/30' : 'px-3 py-1 text-sm'}
                  ${isSelected && !option.tag ? 'bg-primary text-surface' : ''}`}
            >
              {option.tag ? <Tag tag={option.tag} size="sm" active={isSelected} /> : option.label}
            </button>
          );
        })}
      </div>
      {/* Hidden inputs to submit selected IDs */}
      {name &&
        Array.from(selected).map((optionId) => (
          <input key={optionId} type="hidden" name={name} value={optionId} />
        ))}
    </div>
  );
}
