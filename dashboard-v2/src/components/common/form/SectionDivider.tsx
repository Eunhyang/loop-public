interface SectionDividerProps {
  title?: string;
  className?: string;
}

/**
 * Visual section divider for separating form sections
 * Optionally displays a section title
 */
export function SectionDivider({ title, className = '' }: SectionDividerProps) {
  if (title) {
    return (
      <div className={`flex items-center gap-4 my-6 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-700 whitespace-nowrap">{title}</h3>
        <div className="flex-1 border-t border-gray-200" />
      </div>
    );
  }

  return <div className={`border-t border-gray-200 my-6 ${className}`} />;
}
