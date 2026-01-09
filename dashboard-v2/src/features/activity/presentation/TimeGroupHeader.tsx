/**
 * Presentation Layer - Time Group Header
 *
 * Sticky header for time-grouped sections
 * Pure presentational component
 */

interface TimeGroupHeaderProps {
  label: string; // "오늘", "어제", "이번 주", "1월 5일"
}

/**
 * Sticky date header for grouped timeline
 */
export function TimeGroupHeader({ label }: TimeGroupHeaderProps) {
  return (
    <div className="sticky top-0 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500 z-10">
      {label}
    </div>
  );
}
