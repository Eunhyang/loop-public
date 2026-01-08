/**
 * useFilterIndicator Hook
 *
 * Counts active filters (non-default values) and provides clearAll function
 * Used to display filter indicator badge and clear button
 */

import { useMemo } from 'react';
import { DEFAULT_LOCAL_FILTERS } from '@/constants/filterDefaults';
import { useCombinedFilters } from './useCombinedFilters';

export interface FilterIndicator {
  count: number;
  activeFilters: string[];
  hasActiveFilters: boolean;
  clearAll: () => void;
}

/**
 * Counts active filters and returns clear function
 */
export const useFilterIndicator = (): FilterIndicator => {
  const filters = useCombinedFilters();

  const { count, activeFilters } = useMemo(() => {
    let count = 0;
    const active: string[] = [];

    // Check URL filters
    if (filters.assignees.length > 0) {
      count += filters.assignees.length;
      active.push(`Assignees: ${filters.assignees.join(', ')}`);
    }
    if (filters.projectId) {
      count++;
      active.push(`Project: ${filters.projectId}`);
    }
    if (filters.programId) {
      count++;
      active.push(
        filters.programId === 'none' ? 'Program: Unassigned' : `Program: ${filters.programId}`
      );
    }
    if (filters.trackId) {
      count++;
      active.push(`Track: ${filters.trackId}`);
    }
    if (filters.hypothesisId) {
      count++;
      active.push(`Hypothesis: ${filters.hypothesisId}`);
    }
    if (filters.conditionId) {
      count++;
      active.push(`Condition: ${filters.conditionId}`);
    }
    if (filters.dateFilter) {
      count++;
      active.push(`Quick Date: ${filters.dateFilter === 'W' ? 'Week' : 'Month'}`);
    }
    if (filters.selectedWeeks.length > 0) {
      count += filters.selectedWeeks.length;
      active.push(`Weeks: ${filters.selectedWeeks.join(', ')}`);
    }
    if (filters.selectedMonths.length > 0) {
      count += filters.selectedMonths.length;
      active.push(`Months: ${filters.selectedMonths.join(', ')}`);
    }

    // Check localStorage filters (compare with defaults)
    if (filters.showInactiveMembers !== DEFAULT_LOCAL_FILTERS.showInactiveMembers) {
      count++;
      active.push('Show Inactive Members');
    }
    if (filters.showNonCoreMembers !== DEFAULT_LOCAL_FILTERS.showNonCoreMembers) {
      count++;
      active.push('Show Non-Core Members');
    }
    if (filters.showInactiveProjects !== DEFAULT_LOCAL_FILTERS.showInactiveProjects) {
      count++;
      active.push('Show Inactive Projects');
    }

    // Project filters (compare without mutation)
    const projectStatusMatch =
      filters.projectStatus.length === DEFAULT_LOCAL_FILTERS.projectStatus.length &&
      [...filters.projectStatus].sort().join() === [...DEFAULT_LOCAL_FILTERS.projectStatus].sort().join();
    if (!projectStatusMatch) {
      count++;
      active.push(`Project Status: ${filters.projectStatus.join(', ')}`);
    }

    const projectPriorityMatch =
      filters.projectPriority.length === DEFAULT_LOCAL_FILTERS.projectPriority.length &&
      [...filters.projectPriority].sort().join() === [...DEFAULT_LOCAL_FILTERS.projectPriority].sort().join();
    if (!projectPriorityMatch) {
      count++;
      active.push(`Project Priority: ${filters.projectPriority.join(', ')}`);
    }

    // Task filters (compare without mutation)
    const taskStatusMatch =
      filters.taskStatus.length === DEFAULT_LOCAL_FILTERS.taskStatus.length &&
      [...filters.taskStatus].sort().join() === [...DEFAULT_LOCAL_FILTERS.taskStatus].sort().join();
    if (!taskStatusMatch) {
      count++;
      active.push(`Task Status: ${filters.taskStatus.join(', ')}`);
    }

    const taskPriorityMatch =
      filters.taskPriority.length === DEFAULT_LOCAL_FILTERS.taskPriority.length &&
      [...filters.taskPriority].sort().join() === [...DEFAULT_LOCAL_FILTERS.taskPriority].sort().join();
    if (!taskPriorityMatch) {
      count++;
      active.push(`Task Priority: ${filters.taskPriority.join(', ')}`);
    }

    const taskTypesMatch =
      filters.taskTypes.length === DEFAULT_LOCAL_FILTERS.taskTypes.length &&
      [...filters.taskTypes].sort().join() === [...DEFAULT_LOCAL_FILTERS.taskTypes].sort().join();
    if (!taskTypesMatch) {
      count++;
      active.push(`Task Types: ${filters.taskTypes.join(', ')}`);
    }

    // Date range
    if (filters.dueDateStart || filters.dueDateEnd) {
      count++;
      const start = filters.dueDateStart || '...';
      const end = filters.dueDateEnd || '...';
      active.push(`Date Range: ${start} to ${end}`);
    }

    return { count, activeFilters: active };
  }, [filters]);

  return {
    count,
    activeFilters,
    hasActiveFilters: count > 0,
    clearAll: filters.clearAll,
  };
};
