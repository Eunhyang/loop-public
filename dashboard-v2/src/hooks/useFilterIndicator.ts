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

    // Project filters
    if (
      JSON.stringify(filters.projectStatus.sort()) !==
      JSON.stringify(DEFAULT_LOCAL_FILTERS.projectStatus.sort())
    ) {
      count++;
      active.push(`Project Status: ${filters.projectStatus.join(', ')}`);
    }
    if (filters.projectPriority.length > 0) {
      count++;
      active.push(`Project Priority: ${filters.projectPriority.join(', ')}`);
    }

    // Task filters
    if (filters.taskStatus.length > 0) {
      count++;
      active.push(`Task Status: ${filters.taskStatus.join(', ')}`);
    }
    if (filters.taskPriority.length > 0) {
      count++;
      active.push(`Task Priority: ${filters.taskPriority.join(', ')}`);
    }
    if (filters.taskTypes.length > 0) {
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
