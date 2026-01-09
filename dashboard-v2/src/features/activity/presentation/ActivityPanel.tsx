/**
 * Presentation Layer - Activity Panel Container
 *
 * Container component that connects UI state and business logic
 * Responsibilities:
 * - Connect to UiContext for panel open/close state
 * - Fetch data via useGlobalAuditLog hook
 * - Handle entity click navigation
 * - Pass data to presentational components
 */

import { useUi } from '@/contexts/UiContext';
import { useGlobalAuditLog } from '../application/useGlobalAuditLog';
import { ActivityTimeline } from './ActivityTimeline';
import type { EntityType } from '../domain/types';

export function ActivityPanel() {
  const { activityPanelOpen, closeActivityPanel, openEntityFromActivity } = useUi();

  // Only fetch when panel is open (performance optimization)
  const { groups, isLoading, isError, refetch } = useGlobalAuditLog(50, activityPanelOpen);

  // Don't render if panel is closed
  if (!activityPanelOpen) {
    return null;
  }

  /**
   * Handle entity click - open EntityDrawer with navigation tracking
   */
  const handleEntityClick = (entityType: string, entityId: string) => {
    const type = entityType.toLowerCase() as EntityType;
    openEntityFromActivity({ type, mode: 'edit', id: entityId });
  };

  return (
    // NOTE: NO backdrop div - removed to prevent black screen over Kanban
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-50 z-30 shadow-xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
          <p className="text-sm text-gray-500">최근 변경 내역</p>
        </div>
        <button
          onClick={closeActivityPanel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close activity panel"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ActivityTimeline
          groups={groups}
          isLoading={isLoading}
          isError={isError}
          onEntityClick={handleEntityClick}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Refreshing...' : '새로고침'}
        </button>
      </div>
    </div>
  );
}
