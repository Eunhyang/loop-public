import type { ChipColor } from '../chipColors';

export interface EntityChipProps {
    label: string;
    value?: string;
    icon?: string;
    isSelected?: boolean;
    disabled?: boolean;
    /**
     * 'select': Standard pill for selection, shows ✓ when active
     * 'link': Split pill with a navigation arrow (→) on the right
     */
    mode?: 'select' | 'link';
    color?: ChipColor;
    /** Called when the left/main part of the chip is clicked */
    onClick?: (value?: string) => void;
    /** Called when the right '→' part is clicked (only in 'link' mode) */
    onNavigate?: () => void;
    className?: string;
}

/**
 * EntityChip - Standardized chip for selection and entity linking
 *
 * Adheres to the "Split Pill" and "Selection/Radio Group" patterns.
 */
export function EntityChip({
    label,
    value,
    icon,
    isSelected = false,
    disabled = false,
    mode = 'select',
    color,
    onClick,
    onNavigate,
    className = '',
}: EntityChipProps) {
    const handleClick = () => {
        if (disabled) return;
        onClick?.(value);
    };

    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        onNavigate?.();
    };

    // Base styles
    const baseClasses = `
    inline-flex items-center text-xs rounded-md border
    transition-all duration-150
    focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 focus-within:ring-offset-1
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

    // Color logic
    const colorClasses = isSelected
        ? color
            ? `${color.selected} ${color.text} font-semibold shadow-sm`
            : 'bg-zinc-900 shadow-sm border-zinc-900 text-white font-semibold'
        : color
            ? `${color.bg} ${color.text} border-transparent hover:border-zinc-300`
            : 'bg-zinc-100 text-zinc-700 border-transparent hover:border-zinc-300';

    if (mode === 'link') {
        return (
            <div className={`${baseClasses} ${colorClasses} overflow-hidden p-0`}>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={handleClick}
                    className="flex items-center gap-1 px-2 py-0.5 border-r border-inherit hover:bg-black/5 transition-colors focus:outline-none"
                >
                    {isSelected && <span className="text-[10px] leading-none">✓</span>}
                    {icon && <span>{icon}</span>}
                    <span className="truncate max-w-[150px]">{label}</span>
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={handleNavigate}
                    title="View details"
                    className="px-1.5 py-0.5 hover:bg-black/5 transition-colors focus:outline-none"
                >
                    <span className="text-zinc-400 group-hover:text-inherit">→</span>
                </button>
            </div>
        );
    }

    // Standard 'select' mode
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={handleClick}
            role="radio"
            aria-checked={isSelected}
            className={`
        ${baseClasses} ${colorClasses}
        px-2 py-0.5 gap-1
        hover:shadow-sm
      `}
        >
            {isSelected && <span className="text-[10px] leading-none">✓</span>}
            {icon && <span>{icon}</span>}
            <span className="truncate max-w-[150px]">{label}</span>
        </button>
    );
}
