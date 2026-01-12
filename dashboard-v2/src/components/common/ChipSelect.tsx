import { EntitySelector, type EntitySelectorOption } from './entity';
import type { ChipColor } from './chipColors';

export interface ChipOption {
  value: string;
  label: string;
  color?: ChipColor;
  icon?: string;
}

export interface ChipSelectProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * ChipSelect - Notion-style single-select chip component
 * Refactored to use the common EntitySelector for consistent logic and styling.
 */
export function ChipSelect({
  options,
  value,
  onChange,
  disabled = false,
  label,
}: ChipSelectProps) {
  const selectorOptions: EntitySelectorOption[] = options.map(opt => ({
    id: opt.value,
    label: opt.label,
    color: opt.color,
    icon: opt.icon,
  }));

  return (
    <EntitySelector
      label={label}
      options={selectorOptions}
      selectedIds={[value]}
      maxVisible={options.length} // Show all by default for basic ChipSelect
      onSelect={onChange}
      disabled={disabled}
      className="w-full"
    />
  );
}
