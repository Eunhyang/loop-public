import { useUi } from '@/contexts/UiContext';
import { useActivityFeed } from '../queries';
import { ActivityFeed } from './ActivityFeed';
import type { EntityType } from '../types';

export function ActivityPanel() {
  const { activityPanelOpen, selectedActivityEntity, closeActivityPanel } = useUi();

  // Don't render if panel is closed or no entity selected
  if (!activityPanelOpen || !selectedActivityEntity) {
    return null;
  }

  const { type, id } = selectedActivityEntity;

  return (
    <ActivityPanelContent
      entityType={type}
      entityId={id}
      onClose={closeActivityPanel}
    />
  );
}

interface ActivityPanelContentProps {
  entityType: EntityType;
  entityId: string;
  onClose: () => void;
}

function ActivityPanelContent({ entityType, entityId, onClose }: ActivityPanelContentProps) {
  const { feedItems, isLoading, isError, hasPartialError, refetch } = useActivityFeed({
    entityType,
    entityId,
    enabled: true,
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-50 z-30 shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
            <p className="text-sm text-gray-500">
              {entityType} • {entityId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close activity panel"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <ActivityFeed
            items={feedItems}
            isLoading={isLoading}
            isError={isError}
            hasPartialError={hasPartialError}
          />
        </div>

        {/* Footer (optional - for actions) */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </>
  );
}
