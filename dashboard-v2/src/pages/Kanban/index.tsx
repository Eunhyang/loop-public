import { useMemo, useEffect } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useKanbanFilters } from './useKanbanFilters';
import { KanbanBoard } from '@/features/tasks/components/Kanban/KanbanBoard';
import { KanbanFilters } from './KanbanFilters';
import { buildKanbanColumns } from '@/features/tasks/selectors';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { FilterPanel } from '@/features/filters/components/FilterPanel';
import type { KanbanColumns } from '@/features/tasks/components/Kanban/KanbanBoard';
import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { useUi } from '@/contexts/UiContext';

const KanbanPageContent = () => {
  const { data, isLoading, error } = useDashboardInit();
  const urlFilters = useKanbanFilters();
  const panelFilters = useFilterContext();
  const combinedFilters = useCombinedFilters();
  const { openEntityDrawer, closeEntityDrawer, activeEntityDrawer } = useUi();

  // Memoized filtering and grouping
  const filteredColumns: KanbanColumns = useMemo(() => {
    if (!data) {
      return { todo: [], doing: [], hold: [], done: [], blocked: [] };
    }

    // Use combined filters from hook (already merges URL + localStorage)
    return buildKanbanColumns(
      data.tasks,
      combinedFilters,
      data.projects,
      data.members
    );
  }, [data, combinedFilters]);

  // Handle Escape key to close modal
  // Note: DrawerShell already handles ESC, but this provides additional safety
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeEntityDrawer?.type === 'task') {
        closeEntityDrawer();
      }
    };
    if (activeEntityDrawer?.type === 'task') {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeEntityDrawer, closeEntityDrawer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm text-gray-500 mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </svg>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <KanbanFilters
        filters={urlFilters}
        members={data.members}
        projects={data.projects}
        programs={data.programs || []}
        tasks={data.tasks}
      />

      <KanbanBoard
        columns={filteredColumns}
        onCardClick={(task) => openEntityDrawer({ type: 'task', mode: 'edit', id: task.entity_id })}
      />

      {/* Filter Panel */}
      <FilterPanel
        isOpen={panelFilters.isPanelOpen}
        onClose={panelFilters.togglePanel}
      />
    </div>
  );
};

/**
 * Main Kanban page component
 * Note: FilterProvider is now at AppLayout level for global keyboard shortcuts
 */
export const KanbanPage = () => {
  return <KanbanPageContent />;
};
