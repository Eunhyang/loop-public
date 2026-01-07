import { useMemo, useState, useEffect } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useKanbanFilters } from './useKanbanFilters';
import { KanbanBoard } from '@/features/tasks/components/Kanban/KanbanBoard';
import { TaskDrawer } from '@/features/tasks/components/TaskDrawer';
import { KanbanFilters } from './KanbanFilters';
import { buildKanbanColumns } from '@/features/tasks/selectors';
import type { Task } from '@/types';
import type { KanbanColumns } from '@/features/tasks/components/Kanban/KanbanBoard';

/**
 * Main Kanban page component
 * Orchestrates data loading, filtering, and rendering
 */
export const KanbanPage = () => {
  const { data, isLoading, error } = useDashboardInit();
  const filters = useKanbanFilters();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Memoized filtering and grouping
  const filteredColumns: KanbanColumns = useMemo(() => {
    // Safety check inside hook
    if (!data) {
      return { todo: [], doing: [], hold: [], done: [], blocked: [] };
    }

    return buildKanbanColumns(data.tasks, filters);
  }, [data, filters.assignees, filters.projectId, filters.dateFilter]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTask) {
        setSelectedTask(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedTask]);

  // Handle loading and error states
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
          </svg>
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Ensure data exists before rendering children (though hooks ran above)
  if (!data) return null;

  return (
    <div className="h-full flex flex-col">
      <KanbanFilters
        filters={filters}
        members={data.members}
        projects={data.projects}
      />
      <KanbanBoard
        columns={filteredColumns}
        onCardClick={setSelectedTask}
      />

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTask?.entity_id || null}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};
