/**
 * Presentation Layer - Activity Timeline
 *
 * Presentational component for rendering grouped activity timeline
 * No business logic, only UI rendering
 */

import type { TimeGroup } from '../domain/types';
import { TimeGroupHeader } from './TimeGroupHeader';
import { ActivityItem } from './ActivityItem';

interface ActivityTimelineProps {
  groups: TimeGroup[];
  isLoading: boolean;
  isError: boolean;
  onEntityClick: (entityType: string, entityId: string) => void;
}

/**
 * Renders timeline of activity groups (Today, Yesterday, etc.)
 * Handles loading, error, and empty states
 */
export function ActivityTimeline({
  groups,
  isLoading,
  isError,
  onEntityClick,
}: ActivityTimelineProps) {
  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (isError) {
    return <ErrorState />;
  }

  // Empty state
  if (groups.length === 0) {
    return <EmptyState />;
  }

  // Normal state - render timeline
  return (
    <div className="divide-y divide-gray-100">
      {groups.map(group => (
        <div key={group.label}>
          <TimeGroupHeader label={group.label} />
          <div className="space-y-2 p-4">
            {group.items.map(item => (
              <ActivityItem
                key={`${item.entity_id}-${item.timestamp}`}
                item={item}
                onClick={() => onEntityClick(item.entity_type, item.entity_id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading activity...</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load activity</h3>
      <p className="text-sm text-gray-500">Please try refreshing</p>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Recent changes to tasks, projects, and other entities will appear here
      </p>
    </div>
  );
}
