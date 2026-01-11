import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { Hypothesis } from '@/types';

interface HypothesisSelectorProps {
  /** All available hypotheses */
  hypotheses: Hypothesis[];
  /** Currently validated hypothesis IDs (multi-select) */
  validates: string[];
  /** Primary hypothesis ID (single-select) */
  primaryHypothesisId: string | null;
  /** Callback when validates changes */
  onValidatesChange: (ids: string[]) => void;
  /** Callback when primary hypothesis changes */
  onPrimaryChange: (id: string | null) => void;
  /** Callback when a hypothesis is clicked (for right panel navigation) */
  onHypothesisClick?: (hypId: string) => void;
  /** Whether the editor is read-only */
  readonly?: boolean;
}

// Purple color scheme for hypothesis chips
const hypothesisColor = {
  bg: 'bg-white border-zinc-200',
  text: 'text-zinc-500',
  selected: '!bg-[#f5f3ff] !text-[#5b21b6] !border-[#ddd6fe]',
};

/**
 * Selector component for Validates and Primary Hypothesis
 *
 * Features:
 * - Validates: Multi-select with toggle chips
 * - Primary Hypothesis: Single-select dropdown (only from validated)
 * - Click hypothesis to view in right panel
 * - Readonly mode support
 */
export function HypothesisSelector({
  hypotheses,
  validates,
  primaryHypothesisId,
  onValidatesChange,
  onPrimaryChange,
  onHypothesisClick,
  readonly = false,
}: HypothesisSelectorProps) {
  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Create a set for quick lookup
  const validatesSet = useMemo(() => new Set(validates), [validates]);

  // Get hypothesis name by ID
  const getHypothesisName = useCallback((hypId: string): string => {
    const hyp = hypotheses.find(h => h.entity_id === hypId);
    return hyp?.entity_name || hypId;
  }, [hypotheses]);

  // Toggle hypothesis in validates list
  const handleToggleValidates = useCallback((hypId: string) => {
    if (readonly) return;

    if (validatesSet.has(hypId)) {
      // Remove from validates
      const newValidates = validates.filter(id => id !== hypId);
      onValidatesChange(newValidates);
      // If this was the primary, clear it
      if (primaryHypothesisId === hypId) {
        onPrimaryChange(null);
      }
    } else {
      // Add to validates
      onValidatesChange([...validates, hypId]);
    }
  }, [validates, validatesSet, primaryHypothesisId, onValidatesChange, onPrimaryChange, readonly]);

  // Handle primary hypothesis selection
  const handlePrimarySelect = useCallback((hypId: string | null) => {
    if (readonly) return;
    onPrimaryChange(hypId);
    setIsPrimaryDropdownOpen(false);
  }, [onPrimaryChange, readonly]);

  // Handle hypothesis chip click (for navigation)
  const handleHypothesisClick = useCallback((e: React.MouseEvent, hypId: string) => {
    e.stopPropagation();
    onHypothesisClick?.(hypId);
  }, [onHypothesisClick]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isPrimaryDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsPrimaryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isPrimaryDropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!isPrimaryDropdownOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPrimaryDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPrimaryDropdownOpen]);

  // Readonly display for Validates
  if (readonly) {
    return (
      <div className="space-y-4">
        {/* Validates Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-1.5">
            Validates
          </label>
          {validates.length === 0 ? (
            <span className="text-zinc-400 text-sm">No hypotheses validated</span>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {validates.map((hypId) => (
                <button
                  key={hypId}
                  type="button"
                  onClick={(e) => handleHypothesisClick(e, hypId)}
                  className="inline-block px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 cursor-pointer hover:bg-purple-100 transition-colors"
                >
                  {getHypothesisName(hypId)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Hypothesis Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-1.5">
            Primary Hypothesis
          </label>
          {primaryHypothesisId ? (
            <button
              type="button"
              onClick={(e) => handleHypothesisClick(e, primaryHypothesisId)}
              className="inline-block px-2 py-1 bg-purple-100 border border-purple-300 rounded text-xs text-purple-800 font-medium cursor-pointer hover:bg-purple-200 transition-colors"
            >
              {getHypothesisName(primaryHypothesisId)}
            </button>
          ) : (
            <span className="text-zinc-400 text-sm">No primary hypothesis</span>
          )}
        </div>
      </div>
    );
  }

  // Editable display
  return (
    <div className="space-y-4">
      {/* Validates Section */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Validates (Multi-select)
        </label>
        <div className="flex flex-wrap gap-2">
          {hypotheses.map((hyp) => {
            const isSelected = validatesSet.has(hyp.entity_id);
            return (
              <button
                key={hyp.entity_id}
                type="button"
                onClick={() => handleToggleValidates(hyp.entity_id)}
                className={`
                  inline-flex items-center gap-1
                  px-2 py-0.5 text-xs rounded-md border
                  transition-all duration-150
                  focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1
                  ${isSelected
                    ? `${hypothesisColor.selected} font-semibold shadow-sm`
                    : `${hypothesisColor.bg} ${hypothesisColor.text} border-transparent hover:border-zinc-300`
                  }
                  cursor-pointer
                `}
                aria-pressed={isSelected}
              >
                {isSelected && <span className="text-xs">+</span>}
                <span className="truncate max-w-[150px]">{hyp.entity_name}</span>
              </button>
            );
          })}
        </div>
        {hypotheses.length === 0 && (
          <p className="text-xs text-zinc-400 mt-1">No hypotheses available</p>
        )}
      </div>

      {/* Primary Hypothesis Section */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Primary Hypothesis
        </label>

        {validates.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Select at least one hypothesis above to set a primary
          </p>
        ) : (
          <>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen)}
              className={`
                inline-flex items-center justify-between gap-2
                min-w-[200px] px-3 py-2 text-sm rounded-md border
                transition-all duration-150
                focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1
                ${primaryHypothesisId
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-white border-zinc-300 text-zinc-500'
                }
                hover:border-purple-300 cursor-pointer
              `}
              aria-haspopup="listbox"
              aria-expanded={isPrimaryDropdownOpen}
            >
              <span className="truncate">
                {primaryHypothesisId
                  ? getHypothesisName(primaryHypothesisId)
                  : 'Select primary hypothesis...'}
              </span>
              <span className={`text-xs transition-transform ${isPrimaryDropdownOpen ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>

            {/* Dropdown */}
            {isPrimaryDropdownOpen && (
              <div
                ref={dropdownRef}
                role="listbox"
                className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-w-[300px] bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden"
              >
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {/* None option */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={!primaryHypothesisId}
                    onClick={() => handlePrimarySelect(null)}
                    className={`
                      w-full text-left px-3 py-2 rounded text-sm
                      hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none
                      transition-colors text-zinc-500
                    `}
                  >
                    None
                  </button>

                  {/* Validated hypotheses only */}
                  {validates.map((hypId) => (
                    <button
                      key={hypId}
                      type="button"
                      role="option"
                      aria-selected={primaryHypothesisId === hypId}
                      onClick={() => handlePrimarySelect(hypId)}
                      className={`
                        w-full text-left px-3 py-2 rounded text-sm
                        hover:bg-purple-50 focus:bg-purple-50 focus:outline-none
                        transition-colors
                        ${primaryHypothesisId === hypId
                          ? 'bg-purple-50 text-purple-700 font-medium'
                          : 'text-zinc-700'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {primaryHypothesisId === hypId && (
                          <span className="text-purple-600">&#10003;</span>
                        )}
                        <span className="truncate">{getHypothesisName(hypId)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-xs text-zinc-400 mt-1">
          Primary must be one of the validated hypotheses
        </p>
      </div>
    </div>
  );
}
