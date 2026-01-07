import { useMemo, useState, useEffect } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useKanbanFilters } from './useKanbanFilters';
import { KanbanBoard } from './KanbanBoard';
import { TaskDrawer } from '@/components/common/TaskDrawer';
import { KanbanFilters } from './KanbanFilters';
import { getWeekRange, getMonthRange, isWithinRange } from './dateUtils';
import type { Task } from '@/types';
import type { KanbanColumns } from './KanbanBoard';

/**
 * Main Kanban page component
 * Orchestrates data loading, filtering, and rendering
 */
// ... imports

/**
 * Main Kanban page component
 * Orchestrates data loading, filtering, and rendering
 */
export const KanbanPage = () => {
  const { data, isLoading, error } = useDashboardInit();
  const filters = useKanbanFilters();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Memoized filtering and grouping
  // MOVED UP: Must be unconditional (before returns)
  const filteredColumns: KanbanColumns = useMemo(() => {
    // Safety check inside hook
    if (!data) {
      return { todo: [], doing: [], hold: [], done: [], blocked: [] };
    }

    const { tasks } = data;
    const { assignees, projectId, dateFilter } = filters;

    // Apply filters
    let filtered = tasks;

    // Assignee filter (multi-select, OR logic)
    if (assignees.length > 0) {
      filtered = filtered.filter(t => assignees.includes(t.assignee));
    }

    // Project filter
    if (projectId) {
      filtered = filtered.filter(t => t.project_id === projectId);
    }

    // Date filter
    if (dateFilter === 'W') {
      const range = getWeekRange();
      filtered = filtered.filter(t => isWithinRange(t.due, range));
    } else if (dateFilter === 'M') {
      const range = getMonthRange();
      filtered = filtered.filter(t => isWithinRange(t.due, range));
    }

    // Group by status
    return {
      todo: filtered.filter(t => t.status === 'todo'),
      doing: filtered.filter(t => t.status === 'doing'),
      hold: filtered.filter(t => t.status === 'hold'),
      done: filtered.filter(t => t.status === 'done'),
      blocked: filtered.filter(t => t.status === 'blocked'),
    };
  }, [data, filters.assignees, filters.projectId, filters.dateFilter]); // Depend on data, not data.tasks

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
