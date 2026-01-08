import type { Task, Project, Member } from '@/types';
import type { KanbanColumns } from './components/Kanban/KanbanBoard';
import type { UrlFilterState, LocalFilterState, CombinedFilterState } from '@/types/filters';
import { getWeekRange, getMonthRange, isWithinRange } from '@/utils/date';
import { getISOWeek } from '@/utils/dateUtils';
import {
  VALID_TASK_STATUSES,
  VALID_PRIORITIES,
  VALID_TASK_TYPES,
} from '@/constants/filterDefaults';

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
 * Check if filter array represents full selection
 * Uses Set comparison to avoid false positives from duplicate/unknown values
 *
 * @param filterArray - Array of selected filter values
 * @param validValues - Array of all valid values for this filter
 * @returns true if filter represents full selection (skip filtering)
 */
function isFullSelection<T extends string>(
  filterArray: T[],
  validValues: readonly T[]
): boolean {
  if (filterArray.length === 0) return false; // Empty = show nothing

  const validSet = new Set(validValues);
  const filterSet = new Set(filterArray.filter((v) => validSet.has(v))); // Only valid values

  return filterSet.size === validSet.size;
}

/**
 * Apply URL-based filters (navigation context)
 * Includes: assignee, projectId, track/hyp/condition, dates
 */
export const applyUrlFilters = (
  tasks: Task[],
  filters: UrlFilterState & { projectIds?: string[] }, // Add projectIds support
  projects: Project[] = []
): Task[] => {
  const {
    assignees,
    projectId,
    projectIds,
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

  // 2. Project ID filter (single project OR multi-project)
  // Priority: projectIds > projectId (new UI uses projectIds)
  if (projectIds && projectIds.length > 0) {
    filtered = filtered.filter((t) => projectIds.includes(t.project_id));
  } else if (projectId) {
    // Legacy single project filter
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

      // Program filter (only when no specific projects selected)
      if (programId && (!projectIds || projectIds.length === 0)) {
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

  // 5. Selected Weeks filter (Multi-select) - ISO Week based
  if (selectedWeeks.length > 0) {
    filtered = filtered.filter((t) => {
      if (!t.due) return false;
      const taskDate = new Date(t.due);
      const isoWeek = getISOWeek(taskDate);
      return selectedWeeks.includes(isoWeek);
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
    taskStatus,
    taskPriority,
    taskTypes,
    dueDateStart,
    dueDateEnd,
  } = filters;
  let filtered = tasks;

  // 1. Task Status Filter
  if (taskStatus.length === 0) {
    // Empty array = show NOTHING
    filtered = [];
  } else if (!isFullSelection(taskStatus, VALID_TASK_STATUSES)) {
    // Partial selection = apply filter
    filtered = filtered.filter((t) => taskStatus.includes(t.status));
  }
  // Full selection = skip filtering (show all)

  // 2. Task Priority Filter
  if (filtered.length > 0) {
    if (taskPriority.length === 0) {
      filtered = [];
    } else if (!isFullSelection(taskPriority, VALID_PRIORITIES)) {
      filtered = filtered.filter((t) => taskPriority.includes(t.priority));
    }
  }

  // 3. Task Type Filter
  if (filtered.length > 0) {
    if (taskTypes.length === 0) {
      filtered = [];
    } else if (!isFullSelection(taskTypes, VALID_TASK_TYPES)) {
      filtered = filtered.filter((t) => t.type && taskTypes.includes(t.type));
    }
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

/**
 * Core roles definition for member filtering
 * Members with these roles are considered "core" team members
 */
const CORE_ROLES = ['Founder', 'Cofounder', 'Member'];

/**
 * Filter Visible Members for UI Display
 * Used by TaskFilterBar to show/hide assignee buttons based on toggles
 *
 * @param members - All available members
 * @param showNonCoreMembers - Toggle for non-core members (Advisor, External, etc.)
 * @param showInactiveMembers - Toggle for inactive members
 * @returns Filtered member list for UI rendering
 */
export const filterVisibleMembers = (
  members: Member[],
  showNonCoreMembers: boolean,
  showInactiveMembers: boolean
): Member[] => {
  return members.filter(member => {
    // Filter 1: Role-based visibility
    if (!showNonCoreMembers && !CORE_ROLES.includes(member.role)) {
      return false;
    }

    // Filter 2: Active status
    if (!showInactiveMembers && member.active === false) {
      return false;
    }

    return true;
  });
};

/**
 * Filter Tasks by Member Properties (active status and role)
 *
 * @param tasks - Tasks to filter
 * @param members - Member list for lookup
 * @param filters - Combined filter state with showInactiveMembers and showNonCoreMembers
 * @returns Filtered tasks based on member visibility settings
 */
export const filterTasksByMembers = (
  tasks: Task[],
  members: Member[],
  filters: CombinedFilterState
): Task[] => {
  // Build member lookup map for O(1) access
  const memberMap = new Map(members.map(m => [m.id, m]));

  return tasks.filter(task => {
    const member = memberMap.get(task.assignee);

    // Keep orphan tasks (no member assigned or member not found)
    if (!member) return true;

    // Filter 1: Show Inactive Members
    // If showInactiveMembers is false, hide tasks assigned to inactive members
    // Note: undefined or true = active, only explicit false = inactive
    if (!filters.showInactiveMembers && member.active === false) {
      return false;
    }

    // Filter 2: Show Non-Core Members
    // If showNonCoreMembers is false, hide tasks assigned to non-core members
    if (!filters.showNonCoreMembers && !CORE_ROLES.includes(member.role)) {
      return false;
    }

    return true;
  });
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
 * Phase 2: Filter tasks (URL filters → Local filters → Project constraints → Member filters)
 */
export const buildKanbanColumns = (
  tasks: Task[],
  filters: CombinedFilterState,
  projects: Project[] = [],
  members: Member[] = []
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

  // Step 4: Apply member filters (active status and role)
  filtered = filterTasksByMembers(filtered, members, filters);

  // Step 5: Group by status for Kanban display
  return groupTasksByStatus(filtered);
};
