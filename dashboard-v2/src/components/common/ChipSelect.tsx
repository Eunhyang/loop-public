import { EntityChip } from './entity';
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
  'aria-label'?: string;
}

/**
 * ChipSelect - Notion-style single-select chip component
 *
 * Refactored to use EntityChip for consistent styling.
 */
export function ChipSelect({
  options,
  value,
  onChange,
  disabled = false,
  label,
  'aria-label': ariaLabel,
}: ChipSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-label={ariaLabel || label}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <EntityChip
            key={option.value}
            label={option.label}
            value={option.value}
            icon={option.icon}
            isSelected={option.value === value}
            disabled={disabled}
            color={option.color}
            onClick={onChange}
            mode="select"
          />
        ))}
      </div>
    </div>
  );
}
