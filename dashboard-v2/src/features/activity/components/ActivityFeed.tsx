import { HistoryItem } from './HistoryItem';
import { CommentActivityItem } from './CommentActivityItem';
import type { ActivityFeedItem } from '../types';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  isLoading: boolean;
  isError: boolean;
  hasPartialError: boolean;
}

export function ActivityFeed({ items, isLoading, isError, hasPartialError }: ActivityFeedProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state (both sources failed)
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700 font-medium">Failed to load activity</p>
        <p className="text-red-600 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  // Partial error (one source failed)
  const partialErrorBanner = hasPartialError && (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center mb-4">
      <p className="text-yellow-800 text-sm">
        Some activity data could not be loaded
      </p>
    </div>
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No activity yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Comments and changes will appear here
        </p>
      </div>
    );
  }

  // Activity list
  return (
    <div>
      {partialErrorBanner}
      <div className="space-y-0">
        {items.map((item) => {
          if (item.itemType === 'comment') {
            return <CommentActivityItem key={item.id} item={item} />;
          } else {
            return <HistoryItem key={item.id} item={item} />;
          }
        })}
      </div>
    </div>
  );
}
