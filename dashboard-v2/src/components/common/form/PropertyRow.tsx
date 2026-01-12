import type { ReactNode } from 'react';

interface PropertyRowProps {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

/**
 * Single property row with label and value
 * Used inside PropertiesGrid for consistent layout
 */
export function PropertyRow({ label, children, className = '', required = false }: PropertyRowProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 ${className}`}>
      <label className="text-sm font-medium text-gray-700 min-w-[140px] pt-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
