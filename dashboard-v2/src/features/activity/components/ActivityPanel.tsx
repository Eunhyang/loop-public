import { useUi } from '@/contexts/UiContext';
import { useActivityFeed } from '../queries';
import { ActivityFeed } from './ActivityFeed';
import type { EntityType } from '../types';

export function ActivityPanel() {
  const { activityPanelOpen, selectedActivityEntity, closeActivityPanel } = useUi();

  // Don't render if panel is closed
  if (!activityPanelOpen) {
    return null;
  }

  // If no entity selected, show empty state with instructions
  if (!selectedActivityEntity) {
    return (
      <ActivityPanelEmpty onClose={closeActivityPanel} />
    );
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

function ActivityPanelEmpty({ onClose }: { onClose: () => void }) {
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
            <p className="text-sm text-gray-500">Recent changes & comments</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close activity panel"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entity selected</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Click on a Task or Project card to view its activity, comments, and change history.
          </p>
        </div>
      </div>
    </>
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
