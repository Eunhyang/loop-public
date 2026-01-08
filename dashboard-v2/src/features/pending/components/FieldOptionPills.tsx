import type { FieldOption } from '../hooks/useFieldOptions';

interface FieldOptionPillsProps {
  field: string; // Still passed for potential aria-labels, but not displayed
  options: FieldOption[];
  selected: unknown;
  suggested: unknown;
  multiSelect: boolean;
  onChange: (value: unknown) => void;
  reasoning?: string;
}

export const FieldOptionPills = ({
  options,
  selected,
  suggested,
  multiSelect,
  onChange,
  reasoning,
}: FieldOptionPillsProps) => {
  // Normalize selected and suggested to Sets for consistent comparison
  const selectedSet = new Set<string>(
    multiSelect && Array.isArray(selected)
      ? selected.map(String)
      : selected
        ? [String(selected)]
        : []
  );

  const suggestedSet = new Set<string>(
    multiSelect && Array.isArray(suggested)
      ? suggested.map(String)
      : suggested
        ? [String(suggested)]
        : []
  );

  const handleClick = (value: string) => {
    if (multiSelect) {
      const newSelected = Array.from(selectedSet);
      if (selectedSet.has(value)) {
        // Remove from selection
        const index = newSelected.indexOf(value);
        if (index > -1) {
          newSelected.splice(index, 1);
        }
      } else {
        // Add to selection
        newSelected.push(value);
      }
      onChange(newSelected);
    } else {
      // Single select: replace
      onChange(value);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label }) => {
          const isSelected = selectedSet.has(value);
          const isSuggested = suggestedSet.has(value);

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              role="switch"
              aria-checked={isSelected}
              aria-label={`${label}${isSuggested ? ' (suggested)' : ''}`}
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                transition-all border
                ${isSelected
                  ? '!bg-[#f0f9ff] !text-[#082f49] border-[#bae6fd] font-semibold'
                  : isSuggested
                    ? '!bg-[#fffbeb] !text-[#78350f] border-[#fef3c7]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }
              `}
            >
              {isSuggested && '★ '}
              {label}
            </button>
          );
        })}
      </div>
      {reasoning && (
        <div className="mt-1 text-xs text-gray-400">
          {reasoning}
        </div>
      )}
    </div>
  );
};
