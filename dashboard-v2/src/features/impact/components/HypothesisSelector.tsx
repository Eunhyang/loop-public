import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { EntitySelector, type EntitySelectorOption } from '@/components/common/entity';
import type { Hypothesis } from '@/types';
import { hypothesisColor } from '@/components/common/chipColors';

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

/**
 * Selector component for Validates and Primary Hypothesis
 * Refactored to use EntitySelector for consistent "+N more" logic.
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

  // Get hypothesis name by ID
  const getHypothesisName = useCallback((hypId: string): string => {
    const hyp = hypotheses.find(h => h.entity_id === hypId);
    return hyp?.entity_name || hypId;
  }, [hypotheses]);

  // Convert hypotheses to options for EntitySelector
  const selectorOptions: EntitySelectorOption[] = useMemo(() => {
    return hypotheses.map(h => ({
      id: h.entity_id,
      label: h.entity_name,
      color: hypothesisColor,
    }));
  }, [hypotheses]);

  // Toggle hypothesis in validates list
  const handleToggleValidates = (hypId: string) => {
    if (readonly) return;

    let newValidates: string[];
    if (validates.includes(hypId)) {
      newValidates = validates.filter(id => id !== hypId);
      // If this was the primary, clear it
      if (primaryHypothesisId === hypId) {
        onPrimaryChange(null);
      }
    } else {
      newValidates = [...validates, hypId];
    }
    onValidatesChange(newValidates);
  };

  // Handle primary hypothesis selection
  const handlePrimarySelect = useCallback((hypId: string | null) => {
    if (readonly) return;
    onPrimaryChange(hypId);
    setIsPrimaryDropdownOpen(false);
  }, [onPrimaryChange, readonly]);


  // Close dropdown on click outside
  useEffect(() => {
    if (!isPrimaryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsPrimaryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isPrimaryDropdownOpen]);

  return (
    <div className="space-y-6">
      {/* Validates Section */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Validates
        </label>
        <EntitySelector
          options={selectorOptions}
          selectedIds={validates}
          maxVisible={6}
          mode="link"
          disabled={readonly}
          onSelect={handleToggleValidates}
          onNavigate={onHypothesisClick}
        />
      </div>

      {/* Primary Hypothesis Section */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Primary Hypothesis
        </label>

        {validates.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Select at least one hypothesis above to set a primary
          </p>
        ) : (
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => !readonly && setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen)}
              disabled={readonly}
              className={`
                w-full flex items-center justify-between px-3 py-2 bg-white border rounded-md text-sm
                ${readonly ? 'bg-zinc-50 border-zinc-200 cursor-not-allowed' : 'border-zinc-300 hover:border-zinc-400 cursor-pointer'}
                transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500
              `}
            >
              <span className={primaryHypothesisId ? 'text-zinc-900 font-medium' : 'text-zinc-400'}>
                {primaryHypothesisId ? getHypothesisName(primaryHypothesisId) : 'Select primary hypothesis...'}
              </span>
              {!readonly && <span className="text-zinc-400">▼</span>}
            </button>

            {isPrimaryDropdownOpen && (
              <div ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handlePrimarySelect(null)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-purple-50"
                >
                  None
                </button>
                {validates.map((hypId) => (
                  <button
                    key={hypId}
                    type="button"
                    onClick={() => handlePrimarySelect(hypId)}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-purple-50 
                      ${hypId === primaryHypothesisId ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-zinc-700'}
                    `}
                  >
                    {getHypothesisName(hypId)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] text-zinc-400 mt-1">
          Primary must be one of the validated hypotheses
        </p>
      </div>
    </div>
  );
}
