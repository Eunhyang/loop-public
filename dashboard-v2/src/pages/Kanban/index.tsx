import { useMemo, useState, useEffect } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useKanbanFilters } from './useKanbanFilters';
import { KanbanBoard } from './KanbanBoard';
import { KanbanFilters } from './KanbanFilters';
import { getWeekRange, getMonthRange, isWithinRange } from './dateUtils';
import type { Task } from '@/types';
import type { KanbanColumns } from './KanbanBoard';

/**
 * Main Kanban page component
 * Orchestrates data loading, filtering, and rendering
 */
export const KanbanPage = () => {
  const { data, isLoading, error } = useDashboardInit();
  const filters = useKanbanFilters();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  if (!data) {
    return null;
  }

  // Memoized filtering and grouping
  const filteredColumns: KanbanColumns = useMemo(() => {
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
  }, [data.tasks, filters.assignees, filters.projectId, filters.dateFilter]);

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

      {/* Task Drawer - TODO: Implement proper drawer component */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setSelectedTask(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-drawer-title"
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 id="task-drawer-title" className="text-xl font-semibold">{selectedTask.entity_name}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {selectedTask.entity_id}</p>
              <p><strong>Project:</strong> {selectedTask.project_id}</p>
              <p><strong>Assignee:</strong> {selectedTask.assignee}</p>
              <p><strong>Status:</strong> {selectedTask.status}</p>
              <p><strong>Priority:</strong> {selectedTask.priority}</p>
              <p><strong>Due:</strong> {selectedTask.due || 'Not set'}</p>
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <p><strong>Tags:</strong> {selectedTask.tags.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
