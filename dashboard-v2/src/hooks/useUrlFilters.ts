/**
 * useUrlFilters Hook
 *
 * Manages shareable filter state via URL search params
 * Refactored from useKanbanFilters with added programId support
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { UseUrlFiltersReturn, DateFilter } from '@/types/filters';
import { DEFAULT_URL_FILTERS } from '@/constants/filterDefaults';

/**
 * Hook for managing URL-based filter state
 * All filters are shareable via URL
 */
export const useUrlFilters = (): UseUrlFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================================================
  // Read current filter values from URL
  // ============================================================================

  // Note: useMemo with searchParams.toString() to trigger re-compute when URL changes
  const assignees = useMemo(
    () => searchParams.getAll('assignee'),
    [searchParams.toString()]
  );

  const projectId = searchParams.get('project_id') || null;

  const projectIds = useMemo(
    () => searchParams.getAll('project_ids'),
    [searchParams.toString()]
  );

  const programId = searchParams.get('program') || null; // null = All, 'none' = Unassigned, 'pgm-xxx' = Specific

  const trackId = searchParams.get('track') || null;

  const hypothesisId = searchParams.get('hypothesis') || null;

  const conditionId = searchParams.get('condition') || null;

  const dateFilter = (searchParams.get('date') || '') as DateFilter;

  const selectedWeeks = useMemo(
    () => searchParams.getAll('week'),
    [searchParams.toString()]
  );

  const selectedMonths = useMemo(
    () => searchParams.getAll('month'),
    [searchParams.toString()]
  );

  // ============================================================================
  // Setters for URL params
  // ============================================================================

  const setAssignees = useCallback(
    (values: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('assignee');
      values.forEach((v) => newParams.append('assignee', v));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setProjectId = useCallback(
    (id: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (id) {
        newParams.set('project_id', id);
      } else {
        newParams.delete('project_id');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setProjectIds = useCallback(
    (ids: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('project_ids');
      newParams.delete('project_id'); // Clear legacy param
      ids.forEach((id) => newParams.append('project_ids', id));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const toggleProjectId = useCallback(
    (id: string) => {
      const newParams = new URLSearchParams(searchParams);
      const current = searchParams.getAll('project_ids');
      newParams.delete('project_ids');
      newParams.delete('project_id'); // Clear legacy param
      if (current.includes(id)) {
        current.filter((p) => p !== id).forEach((p) => newParams.append('project_ids', p));
      } else {
        [...current, id].forEach((p) => newParams.append('project_ids', p));
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setProgramId = useCallback(
    (id: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (id === null || id === '') {
        newParams.delete('program'); // All programs
      } else {
        newParams.set('program', id); // 'none' or 'pgm-xxx'
      }
      // Program 변경 시 projectIds 초기화
      newParams.delete('project_ids');
      newParams.delete('project_id');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setTrackId = useCallback(
    (id: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (id) {
        newParams.set('track', id);
      } else {
        newParams.delete('track');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setHypothesisId = useCallback(
    (id: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (id) {
        newParams.set('hypothesis', id);
      } else {
        newParams.delete('hypothesis');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setConditionId = useCallback(
    (id: string | null) => {
      const newParams = new URLSearchParams(searchParams);
      if (id) {
        newParams.set('condition', id);
      } else {
        newParams.delete('condition');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setDateFilter = useCallback(
    (filter: DateFilter) => {
      const newParams = new URLSearchParams(searchParams);
      if (filter) {
        newParams.set('date', filter);
      } else {
        newParams.delete('date');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setSelectedWeeks = useCallback(
    (values: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('week');
      values.forEach((v) => newParams.append('week', v));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const setSelectedMonths = useCallback(
    (values: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('month');
      values.forEach((v) => newParams.append('month', v));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  // Initialize default URL filters on first mount
  const initialized = useRef(false);
  useEffect(() => {
    // Only run once on mount
    if (initialized.current) return;
    initialized.current = true;

    // Check if URL is completely empty (no filter params at all)
    const hasAnyFilters =
      searchParams.has('assignee') ||
      searchParams.has('project_id') ||
      searchParams.has('project_ids') ||
      searchParams.has('program') ||
      searchParams.has('track') ||
      searchParams.has('hypothesis') ||
      searchParams.has('condition') ||
      searchParams.has('date') ||
      searchParams.has('week') ||
      searchParams.has('month');

    if (!hasAnyFilters) {
      // Apply default filters
      const newParams = new URLSearchParams(searchParams);

      // Set default assignees
      DEFAULT_URL_FILTERS.assignees.forEach(a => newParams.append('assignee', a));

      // Set default date filter
      if (DEFAULT_URL_FILTERS.dateFilter) {
        newParams.set('date', DEFAULT_URL_FILTERS.dateFilter);
      }

      setSearchParams(newParams, { replace: true });
    }
  }, []); // Empty deps: run only once on mount

  const clearUrlFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    // Clear all filter params
    newParams.delete('assignee');
    newParams.delete('project_id');
    newParams.delete('project_ids');
    newParams.delete('program');
    newParams.delete('track');
    newParams.delete('hypothesis');
    newParams.delete('condition');
    newParams.delete('date');
    newParams.delete('week');
    newParams.delete('month');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return {
    // State
    assignees,
    projectId,
    projectIds,
    programId,
    trackId,
    hypothesisId,
    conditionId,
    dateFilter,
    selectedWeeks,
    selectedMonths,

    // Setters
    setAssignees,
    setProjectId,
    setProjectIds,
    toggleProjectId,
    setProgramId,
    setTrackId,
    setHypothesisId,
    setConditionId,
    setDateFilter,
    setSelectedWeeks,
    setSelectedMonths,
    clearUrlFilters,
  };
};
