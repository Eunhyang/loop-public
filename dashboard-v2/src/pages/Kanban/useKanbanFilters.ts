import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DateFilter = 'W' | 'M' | '';

export interface KanbanFilters {
  assignees: string[];
  projectId: string;
  dateFilter: DateFilter;
  selectedWeeks: string[];
  selectedMonths: string[];
  trackId: string | null;
  hypothesisId: string | null;
  conditionId: string | null;
  setAssignees: (values: string[]) => void;
  setProjectId: (id: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  setSelectedWeeks: (values: string[]) => void;
  setSelectedMonths: (values: string[]) => void;
  clearFilters: () => void;
}

/**
 * URL params hook for Kanban filters
 * Manages filter state via URL search params for persistence
 */
export const useKanbanFilters = (): KanbanFilters => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filter values from URL
  const assignees = useMemo(() => searchParams.getAll('assignee'), [searchParams.toString()]);
  const projectId = searchParams.get('project_id') || '';
  const dateFilter = (searchParams.get('date') || '') as DateFilter;
  const selectedWeeks = useMemo(() => searchParams.getAll('week'), [searchParams.toString()]);
  const selectedMonths = useMemo(() => searchParams.getAll('month'), [searchParams.toString()]);

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

  const setSelectedWeeks = (values: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('week');
    values.forEach(v => newParams.append('week', v));
    setSearchParams(newParams);
  };

  const setSelectedMonths = (values: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('month');
    values.forEach(v => newParams.append('month', v));
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('assignee');
    newParams.delete('project_id');
    newParams.delete('date');
    newParams.delete('week');
    newParams.delete('month');
    newParams.delete('track');
    newParams.delete('hypothesis');
    newParams.delete('condition');
    setSearchParams(newParams);
  };

  return {
    assignees,
    projectId,
    dateFilter,
    selectedWeeks,
    selectedMonths,
    trackId: searchParams.get('track') || null,
    hypothesisId: searchParams.get('hypothesis') || null,
    conditionId: searchParams.get('condition') || null,
    setAssignees,
    setProjectId,
    setDateFilter,
    setSelectedWeeks,
    setSelectedMonths,
    clearFilters,
  };
};
