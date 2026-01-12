import type { ReactNode } from 'react';

interface PropertiesGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Notion-style properties grid layout
 * Displays property rows in a clean, organized format
 * Responsive: 2-column on desktop, single column on mobile
 */
export function PropertiesGrid({ children, className = '' }: PropertiesGridProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {children}
    </div>
  );
}
