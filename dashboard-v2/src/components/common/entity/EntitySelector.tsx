import { useState, useRef, useEffect } from 'react';
import { EntityChip, type EntityChipProps } from './EntityChip';

export interface EntitySelectorOption extends Omit<EntityChipProps, 'onClick' | 'onNavigate'> {
    id: string;
}

export interface EntitySelectorProps {
    options: EntitySelectorOption[];
    selectedIds?: string[];
    maxVisible?: number;
    mode?: 'select' | 'link';
    onSelect?: (id: string) => void;
    onNavigate?: (id: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * EntitySelector - Reusable container for EntityChips with "+N more" logic and dropdown.
 */
export function EntitySelector({
    options,
    selectedIds = [],
    maxVisible = 6,
    mode = 'select',
    onSelect,
    onNavigate,
    label,
    className = '',
    disabled = false,
}: EntitySelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const visibleOptions = options.slice(0, maxVisible);
    const dropdownOptions = options.slice(maxVisible);
    const hasMore = options.length > maxVisible;

    // Handle click outside to close dropdown
    useEffect(() => {
        if (!isExpanded) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Visible items */}
                {visibleOptions.map((option) => (
                    <EntityChip
                        key={option.id}
                        {...option}
                        isSelected={selectedIds.includes(option.id)}
                        mode={mode}
                        disabled={disabled}
                        onClick={() => onSelect?.(option.id)}
                        onNavigate={() => onNavigate?.(option.id)}
                    />
                ))}

                {/* Selected hidden items (if any, always show them as visible) */}
                {dropdownOptions.filter(o => selectedIds.includes(o.id)).map((option) => (
                    <EntityChip
                        key={option.id}
                        {...option}
                        isSelected={true}
                        mode={mode}
                        disabled={disabled}
                        onClick={() => onSelect?.(option.id)}
                        onNavigate={() => onNavigate?.(option.id)}
                    />
                ))}

                {/* "+N more" trigger */}
                {hasMore && (
                    <div className="relative">
                        <button
                            ref={triggerRef}
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            disabled={disabled}
                            aria-haspopup="listbox"
                            aria-expanded={isExpanded}
                            aria-label={`Show ${dropdownOptions.length} more options`}
                            className="
                inline-flex items-center gap-1
                px-2 py-0.5 text-xs rounded-md border border-dashed
                border-zinc-300 text-zinc-600
                transition-all duration-150
                focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
              "
                        >
                            <span>+{dropdownOptions.length} more</span>
                            <span className={`text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {/* Dropdown for hidden items */}
                        {isExpanded && (
                            <div
                                ref={dropdownRef}
                                className="absolute top-full left-0 mt-2 z-50 min-w-[200px] max-w-[320px] bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden"
                            >
                                <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
                                    {dropdownOptions.filter(o => !selectedIds.includes(o.id)).map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                onSelect?.(option.id);
                                                setIsExpanded(false);
                                            }}
                                            className="
                        flex items-center justify-between w-full text-left px-2 py-1.5 rounded
                        hover:bg-zinc-50 transition-colors group
                      "
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {option.icon && <span>{option.icon}</span>}
                                                <span className="truncate text-xs text-zinc-700">{option.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {mode === 'link' && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onNavigate?.(option.id);
                                                            setIsExpanded(false);
                                                        }}
                                                        className="p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
                                                    >
                                                        →
                                                    </button>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
