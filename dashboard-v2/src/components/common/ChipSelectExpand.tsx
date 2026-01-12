import { useMemo } from 'react';
import { EntitySelector, type EntitySelectorOption } from './entity';
import type { ChipColor } from './chipColors';

export interface ChipOption {
  value: string;
  label: string;
  color?: ChipColor;
  icon?: string;
}

export interface ChipSelectExpandProps {
  primaryOptions: ChipOption[];  // Always visible (e.g., Core members)
  allOptions: ChipOption[];      // Complete list
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  allowUnassigned?: boolean;
  unassignedLabel?: string;
}

/**
 * ChipSelectExpand - Notion-style chip selector with expandable dropdown
 * Refactored to use the common EntitySelector for consistent "More" logic.
 */
export function ChipSelectExpand({
  primaryOptions,
  allOptions,
  value,
  onChange,
  disabled = false,
  label,
  allowUnassigned = false,
  unassignedLabel = 'Unassigned',
}: ChipSelectExpandProps) {
  // Combine and normalize options
  const selectorOptions: EntitySelectorOption[] = useMemo(() => {
    const seen = new Set<string>();
    const options: EntitySelectorOption[] = [];

    // 1. Unassigned (if enabled)
    if (allowUnassigned) {
      options.push({ id: '', label: unassignedLabel });
      seen.add('');
    }

    // 2. Primary Options
    primaryOptions.forEach(opt => {
      if (!seen.has(opt.value)) {
        options.push({ id: opt.value, label: opt.label, color: opt.color, icon: opt.icon });
        seen.add(opt.value);
      }
    });

    // 3. All other options
    allOptions.forEach(opt => {
      if (!seen.has(opt.value)) {
        options.push({ id: opt.value, label: opt.label, color: opt.color, icon: opt.icon });
        seen.add(opt.value);
      }
    });

    return options;
  }, [primaryOptions, allOptions, allowUnassigned, unassignedLabel]);

  return (
    <EntitySelector
      label={label}
      options={selectorOptions}
      selectedIds={[value]}
      maxVisible={primaryOptions.length + (allowUnassigned ? 1 : 0)}
      onSelect={onChange}
      disabled={disabled}
      className="w-full"
    />
  );
}
