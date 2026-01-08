import type { Task, Project } from '@/types';
import type { KanbanColumns } from './components/Kanban/KanbanBoard';
import type { UrlFilterState, LocalFilterState, CombinedFilterState } from '@/types/filters';
import { getWeekRange, getMonthRange, isWithinRange } from '@/utils/date';

// ============================================================================
// Legacy type aliases for backward compatibility
// ============================================================================

/**
 * @deprecated Use UrlFilterState from @/types/filters instead
 */
export type KanbanUrlFilters = UrlFilterState;

/**
 * @deprecated Use LocalFilterState from @/types/filters instead
 */
export interface KanbanPanelFilters {
  showInactive: boolean; // Deprecated: Use showInactiveTasks
  showDoneProjects: boolean; // Deprecated: Use showInactiveProjects
  taskStatus: string[];
  taskPriority: string[];
  taskTypes: string[];
  projectStatus: string[];
  projectPriority: string[];
}

/**
 * @deprecated Use CombinedFilterState from @/types/filters instead
 */
export type KanbanFiltersState = CombinedFilterState;

// ============================================================================
// Phase 2: Task Filtering (Pure Functions)
// ============================================================================

/**
 * Apply URL-based filters (navigation context)
 * Includes: assignee, projectId, track/hyp/condition, dates
 */
export const applyUrlFilters = (
  tasks: Task[],
  filters: UrlFilterState,
  projects: Project[] = []
): Task[] => {
  const {
    assignees,
    projectId,
    programId,
    dateFilter,
    selectedWeeks,
    selectedMonths,
    trackId,
    hypothesisId,
    conditionId,
  } = filters;
  let filtered = tasks;

  // 1. Assignee filter (Multi-select)
  if (assignees.length > 0) {
    filtered = filtered.filter((t) => assignees.includes(t.assignee));
  }

  // 2. Project ID filter (single project)
  if (projectId) {
    filtered = filtered.filter((t) => t.project_id === projectId);
  }

  // 3. Context Filters (Track / Hypothesis / Condition / Program)
  if (trackId || hypothesisId || conditionId || programId) {
    const projectById = new Map(projects.map((p) => [p.entity_id, p] as [string, Project]));
    filtered = filtered.filter((t) => {
      const project = projectById.get(t.project_id);
      if (!project) return false; // Exclude orphan tasks

      let match = true;

      // Track filter
      if (trackId) {
        match = match && project.parent_id === trackId;
      }

      // Condition filter
      if (conditionId) {
        match = match && (project.conditions_3y?.includes(conditionId) ?? false);
      }

      // Hypothesis filter
      if (hypothesisId) {
        const hypMatch =
          (project.validates?.includes(hypothesisId) ?? false) ||
          project.primary_hypothesis_id === hypothesisId;
        match = match && hypMatch;
      }

      // Program filter
      if (programId) {
        if (programId === 'none') {
          // Unassigned projects
          match = match && !project.program_id;
        } else {
          // Specific program
          match = match && project.program_id === programId;
        }
      }

      return match;
    });
  }

  // 4. Quick Date filter (W = This Week, M = This Month)
  if (dateFilter === 'W') {
    const range = getWeekRange();
    filtered = filtered.filter((t) => isWithinRange(t.due, range));
  } else if (dateFilter === 'M') {
    const range = getMonthRange();
    filtered = filtered.filter((t) => isWithinRange(t.due, range));
  }

  // 5. Selected Weeks filter (Multi-select)
  if (selectedWeeks.length > 0) {
    filtered = filtered.filter((t) => {
      if (!t.due) return false;
      const taskDate = new Date(t.due);
      const taskYear = taskDate.getFullYear();
      const taskWeek = Math.ceil(
        ((taskDate.getTime() - new Date(taskYear, 0, 1).getTime()) / 86400000 +
          new Date(taskYear, 0, 1).getDay() +
          1) /
          7
      );
      const formattedWeek = `${taskYear}-W${String(taskWeek).padStart(2, '0')}`;
      return selectedWeeks.includes(formattedWeek);
    });
  }

  // 6. Selected Months filter (Multi-select)
  if (selectedMonths.length > 0) {
    filtered = filtered.filter((t) => {
      if (!t.due) return false;
      const taskDate = new Date(t.due);
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth() + 1;
      const formattedMonth = `${taskYear}-${String(taskMonth).padStart(2, '0')}`;
      return selectedMonths.includes(formattedMonth);
    });
  }

  return filtered;
};

/**
 * Apply localStorage-based filters (view preferences)
 * Includes: task status/priority/type, visibility, custom date range
 */
export const applyLocalFilters = (tasks: Task[], filters: LocalFilterState): Task[] => {
  const {
    showInactiveTasks,
    taskStatus,
    taskPriority,
    taskTypes,
    dueDateStart,
    dueDateEnd,
  } = filters;
  let filtered = tasks;

  // 1. Inactive tasks visibility
  if (!showInactiveTasks) {
    // Assuming tasks have an 'active' field or we filter by status
    // For now, hide 'done' tasks as inactive
    filtered = filtered.filter((t) => t.status !== 'done');
  }

  // 2. Task Status Filter
  if (taskStatus.length > 0) {
    filtered = filtered.filter((t) => taskStatus.includes(t.status));
  }

  // 3. Task Priority Filter
  if (taskPriority.length > 0) {
    filtered = filtered.filter((t) => taskPriority.includes(t.priority));
  }

  // 4. Task Type Filter
  if (taskTypes.length > 0) {
    filtered = filtered.filter((t) => t.type && taskTypes.includes(t.type));
  }

  // 5. Custom Date Range Filter
  if (dueDateStart || dueDateEnd) {
    // Validate range
    if (dueDateStart && dueDateEnd && dueDateStart > dueDateEnd) {
      console.warn('Invalid date range: start > end, skipping filter');
      return filtered;
    }

    filtered = filtered.filter((t) => {
      if (!t.due) return false;

      const taskDate = t.due;

      if (dueDateStart && taskDate < dueDateStart) return false;
      if (dueDateEnd && taskDate > dueDateEnd) return false;

      return true;
    });
  }

  return filtered;
};

/**
 * @deprecated Use applyLocalFilters() instead
 * Kept for backward compatibility
 */
export const applyPanelFilters = applyLocalFilters;

/**
 * Filter Tasks by Allowed Project IDs
 * STRICT Separation: This function relies on `allowedProjectIds` calculated by Projects logic.
 */
export const filterTasksByProjects = (tasks: Task[], allowedProjectIds: string[]): Task[] => {
    return tasks.filter(t => allowedProjectIds.includes(t.project_id));
};

// 3. Grouping Logic

export const groupTasksByStatus = (tasks: Task[]): KanbanColumns => {
    return {
        todo: tasks.filter(t => t.status === 'todo'),
        doing: tasks.filter(t => t.status === 'doing'),
        hold: tasks.filter(t => t.status === 'hold'),
        done: tasks.filter(t => t.status === 'done'),
        blocked: tasks.filter(t => t.status === 'blocked'),
    };
};

import { filterProjects } from '@/features/projects/selectors';

// ============================================================================
// Main Orchestrator with Phase 1/2 Separation
// ============================================================================

/**
 * Build Kanban Columns with Phase 1/2 filtering
 *
 * Phase 1: Filter projects → allowedProjectIds
 * Phase 2: Filter tasks (URL filters → Local filters → Project constraints)
 */
export const buildKanbanColumns = (
  tasks: Task[],
  filters: CombinedFilterState,
  projects: Project[] = []
): KanbanColumns => {
  // PHASE 1: Filter projects to get allowed project IDs
  const allowedProjectIds = filterProjects(projects, filters);

  // PHASE 2: Filter tasks in order
  let filtered = tasks;

  // Step 1: Apply URL filters (navigation context)
  filtered = applyUrlFilters(filtered, filters, projects);

  // Step 2: Apply localStorage filters (view preferences)
  filtered = applyLocalFilters(filtered, filters);

  // Step 3: Apply project constraints (from Phase 1)
  filtered = filterTasksByProjects(filtered, allowedProjectIds);

  // Step 4: Group by status for Kanban display
  return groupTasksByStatus(filtered);
};
