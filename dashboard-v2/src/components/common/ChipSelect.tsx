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
 * Features:
 * - Single select only (no multi-select)
 * - Always one option selected (no deselect)
 * - Accessible with ARIA roles
 * - Keyboard support: Tab to focus, Enter/Space to select
 *
 * Usage:
 * ```tsx
 * <ChipSelect
 *   options={statusOptions}
 *   value={task.status}
 *   onChange={(v) => handleUpdate('status', v)}
 *   label="Status"
 * />
 * ```
 */
export function ChipSelect({
  options,
  value,
  onChange,
  disabled = false,
  label,
  'aria-label': ariaLabel,
}: ChipSelectProps) {
  const handleClick = (optionValue: string) => {
    if (disabled || optionValue === value) return;
    onChange(optionValue);
  };

  // Note: onKeyDown removed - <button> already handles Enter/Space via onClick
  // This prevents double-trigger bug (onChange called twice)

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
        {options.map((option) => {
          const isSelected = option.value === value;
          const color = option.color;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              disabled={disabled}
              onClick={() => handleClick(option.value)}
              className={`
                inline-flex items-center gap-1.5
                px-3 py-1.5 text-sm rounded-md border-2
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${isSelected
                  ? color
                    ? `${color.selected} ${color.text} font-semibold shadow-sm`
                    : 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-sm'
                  : color
                    ? `${color.bg} ${color.text} border-transparent hover:border-zinc-300`
                    : 'bg-zinc-100 text-zinc-700 border-transparent hover:border-zinc-300'
                }
                ${disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              {isSelected && <span className="text-xs">✓</span>}
              {option.icon && <span>{option.icon}</span>}
              <span className="capitalize">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
