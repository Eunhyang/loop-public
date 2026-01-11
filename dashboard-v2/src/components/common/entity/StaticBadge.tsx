interface StaticBadgeProps {
  label: string;
  variant?: 'status' | 'priority' | 'info';
  className?: string;
}

const variantColors: Record<NonNullable<StaticBadgeProps['variant']>, string> = {
  status: 'bg-blue-100 text-blue-800',
  priority: 'bg-orange-100 text-orange-800',
  info: 'bg-gray-100 text-gray-800',
};

/**
 * Read-only badge for displaying status, priority, or other metadata
 * Non-interactive, used for visual display only
 */
export function StaticBadge({ label, variant = 'info', className = '' }: StaticBadgeProps) {
  const colorClass = variantColors[variant];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium
        ${colorClass}
        ${className}
      `}
    >
      {label}
    </span>
  );
}
