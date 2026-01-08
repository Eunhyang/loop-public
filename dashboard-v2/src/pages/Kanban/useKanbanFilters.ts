import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DateFilter = 'W' | 'M' | '';

export interface KanbanFilters {
  assignees: string[];
  projectId: string;
  projectIds: string[];
  programId: string | null;
  dateFilter: DateFilter;
  selectedWeeks: string[];
  selectedMonths: string[];
  trackId: string | null;
  hypothesisId: string | null;
  conditionId: string | null;
  setAssignees: (values: string[]) => void;
  setProjectId: (id: string) => void;
  setProjectIds: (ids: string[]) => void;
  toggleProjectId: (id: string) => void;
  setProgramId: (id: string | null) => void;
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
  const projectIds = useMemo(() => searchParams.getAll('project_ids'), [searchParams.toString()]);
  const programId = searchParams.get('program') || null;
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

  const setProjectIds = (ids: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('project_ids');
    ids.forEach(id => newParams.append('project_ids', id));
    setSearchParams(newParams);
  };

  const toggleProjectId = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    const current = searchParams.getAll('project_ids');
    newParams.delete('project_ids');
    if (current.includes(id)) {
      current.filter(p => p !== id).forEach(p => newParams.append('project_ids', p));
    } else {
      [...current, id].forEach(p => newParams.append('project_ids', p));
    }
    setSearchParams(newParams);
  };

  const setProgramId = (id: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set('program', id);
    } else {
      newParams.delete('program');
    }
    // Program 변경 시 projectIds 초기화
    newParams.delete('project_ids');
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
    newParams.delete('project_ids');
    newParams.delete('program');
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
    projectIds,
    programId,
    dateFilter,
    selectedWeeks,
    selectedMonths,
    trackId: searchParams.get('track') || null,
    hypothesisId: searchParams.get('hypothesis') || null,
    conditionId: searchParams.get('condition') || null,
    setAssignees,
    setProjectId,
    setProjectIds,
    toggleProjectId,
    setProgramId,
    setDateFilter,
    setSelectedWeeks,
    setSelectedMonths,
    clearFilters,
  };
};
