import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DateFilter = 'W' | 'M' | '';

export interface KanbanFilters {
  assignees: string[];
  projectId: string;
  dateFilter: DateFilter;
  setAssignees: (values: string[]) => void;
  setProjectId: (id: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  clearFilters: () => void;
}

/**
 * URL params hook for Kanban filters
 * Manages filter state via URL search params for persistence
 */
export const useKanbanFilters = (): KanbanFilters => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filter values from URL
  // Memoize assignees array to prevent useMemo dependency changes on every render
  const assignees = useMemo(() => searchParams.getAll('assignee'), [searchParams.toString()]);
  const projectId = searchParams.get('project_id') || '';
  const dateFilter = (searchParams.get('date') || '') as DateFilter;

  const setAssignees = (values: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('assignee');
    values.forEach(v => newParams.append('assignee', v));
    setSearchParams(newParams);
  };

  const setProjectId = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set('project_id', id);
    } else {
      newParams.delete('project_id');
    }
    setSearchParams(newParams);
  };

  const setDateFilter = (filter: DateFilter) => {
    const newParams = new URLSearchParams(searchParams);
    if (filter) {
      newParams.set('date', filter);
    } else {
      newParams.delete('date');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('assignee');
    newParams.delete('project_id');
    newParams.delete('date');
    setSearchParams(newParams);
  };

  return {
    assignees,
    projectId,
    dateFilter,
    setAssignees,
    setProjectId,
    setDateFilter,
    clearFilters,
  };
};
