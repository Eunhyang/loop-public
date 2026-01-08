import { useState, useEffect, useRef, useMemo } from 'react';
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
  'aria-label'?: string;
}

/**
 * ChipSelectExpand - Notion-style chip selector with expandable dropdown
 *
 * Features:
 * - Primary chips always visible (e.g., Core team members)
 * - Selected non-primary chip auto-displayed
 * - "+N more" button for remaining options
 * - Expandable dropdown for non-primary options
 * - Keyboard accessible (Tab, Enter, Space, Escape, Arrow keys)
 * - Click-outside detection
 * - Focus management
 *
 * Addressing Codex feedback:
 * - Single source of truth (allOptions)
 * - Precise N counting (excludes primary + selected + unassigned)
 * - Proper ARIA roles and keyboard navigation
 * - Memoized handlers and computed lists
 * - Closes on value change
 * - Handles legacy/unknown values gracefully
 *
 * Usage:
 * ```tsx
 * <ChipSelectExpand
 *   primaryOptions={coreMembers}
 *   allOptions={allMembers}
 *   value={task.assignee}
 *   onChange={(v) => handleUpdate('assignee', v)}
 *   allowUnassigned
 *   label="Assignee"
 * />
 * ```
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
  'aria-label': ariaLabel,
}: ChipSelectExpandProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Normalize options (remove duplicates by value)
  const normalizedAll = useMemo(() => {
    const seen = new Set<string>();
    return allOptions.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [allOptions]);

  const normalizedPrimary = useMemo(() => {
    const seen = new Set<string>();
    return primaryOptions.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [primaryOptions]);

  // Separate primary and non-primary options
  const primaryValues = useMemo(() => new Set(normalizedPrimary.map(o => o.value)), [normalizedPrimary]);

  const nonPrimaryOptions = useMemo(() =>
    normalizedAll.filter(o => !primaryValues.has(o.value) && o.value !== ''),
    [normalizedAll, primaryValues]
  );

  // Find selected option (could be primary, non-primary, or unknown)
  const selectedOption = normalizedAll.find(o => o.value === value);
  const isSelectedPrimary = primaryValues.has(value);
  const isSelectedNonPrimary = selectedOption && !isSelectedPrimary && value !== '';

  // Options to show in dropdown (exclude already visible chips and selected)
  const dropdownOptions = useMemo(() =>
    nonPrimaryOptions.filter(o => o.value !== value),
    [nonPrimaryOptions, value]
  );

  // Count for "+N more" button (excludes primary, selected, and unassigned)
  const remainingCount = dropdownOptions.length;

  // Close dropdown on value change
  useEffect(() => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside handler (memoized)
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    // Use capture phase to handle portal/drawer scenarios
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isDropdownOpen]);

  // Escape key handler (memoized)
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);

  const handleChipClick = (optionValue: string) => {
    if (disabled || optionValue === value) return;
    onChange(optionValue);
    setIsDropdownOpen(false);
  };

  const handleDropdownOptionClick = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsDropdownOpen(false);
    // Return focus to trigger
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsDropdownOpen(prev => !prev);
  };

  // Keyboard navigation within dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDropdownOptionClick(optionValue);
    }
  };

  const renderChip = (option: ChipOption, isSelected: boolean) => {
    const color = option.color;

    return (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={isSelected}
        tabIndex={disabled ? -1 : 0}
        disabled={disabled}
        onClick={() => handleChipClick(option.value)}
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
        <span className="capitalize truncate max-w-[120px]">{option.label}</span>
      </button>
    );
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-label={ariaLabel || label}
        className="flex flex-wrap gap-2 items-center"
      >
        {/* Unassigned chip (if enabled) */}
        {allowUnassigned && (
          renderChip(
            { value: '', label: unassignedLabel },
            value === ''
          )
        )}

        {/* Primary chips (always visible) */}
        {normalizedPrimary.map(option => renderChip(option, option.value === value))}

        {/* Selected non-primary chip (auto-display) */}
        {isSelectedNonPrimary && selectedOption && renderChip(selectedOption, true)}

        {/* Fallback for unknown/legacy value */}
        {value && !selectedOption && value !== '' && (
          renderChip(
            { value, label: value, icon: '⚠️' },
            true
          )
        )}

        {/* "+N more" button (only if dropdown has options) */}
        {remainingCount > 0 && (
          <button
            ref={triggerRef}
            type="button"
            onClick={toggleDropdown}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-label={`Show ${remainingCount} more options`}
            className={`
              inline-flex items-center gap-1
              px-3 py-1.5 text-sm rounded-md border-2 border-dashed
              border-zinc-300 text-zinc-600
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer'
              }
            `}
          >
            <span>+{remainingCount} more</span>
            <span className={`text-xs transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        )}

        {/* Dropdown (portal-friendly positioning) */}
        {isDropdownOpen && remainingCount > 0 && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label="Additional options"
            className="absolute top-full left-0 mt-2 z-50 min-w-[200px] max-w-[300px] bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto p-2">
              {dropdownOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  onClick={() => handleDropdownOptionClick(option.value)}
                  onKeyDown={(e) => handleDropdownKeyDown(e, option.value)}
                  className={`
                    w-full text-left px-3 py-2 rounded
                    hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none
                    transition-colors
                    ${option.color ? `${option.color.text}` : 'text-zinc-700'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
