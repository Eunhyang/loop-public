/**
 * useCombinedFilters Hook
 *
 * Merges URL filters (shareable) with localStorage filters (personal preferences)
 * Hydration priority: URL > localStorage > defaults
 */

import { useMemo, useCallback } from 'react';
import type { UseCombinedFiltersReturn } from '@/types/filters';
import { useUrlFilters } from './useUrlFilters';
import { useLocalFilters } from './useLocalFilters';
import { DEFAULT_LOCAL_FILTERS } from '@/constants/filterDefaults';

/**
 * Hook for accessing combined filter state
 * URL params take precedence over localStorage when present
 */
export const useCombinedFilters = (): UseCombinedFiltersReturn => {
  const urlFilters = useUrlFilters();
  const localFilters = useLocalFilters();

  // Memoize combined state
  // URL params override localStorage for overlapping fields
  const combined = useMemo(
    () => ({
      // Start with defaults
      ...DEFAULT_LOCAL_FILTERS,
      // Apply localStorage preferences
      ...localFilters,
      // Apply URL params (highest priority)
      ...urlFilters,
      // Note: localFilters and urlFilters don't overlap in field names
      // but this structure ensures correct precedence if they did
    }),
    [urlFilters, localFilters]
  );

  // Clear all filters (both URL and localStorage)
  const clearAll = useCallback(() => {
    // Clear URL params
    urlFilters.clearUrlFilters();

    // Reset localStorage to defaults
    localFilters.resetLocal();
  }, [urlFilters, localFilters]);

  return {
    // Combined state
    ...combined,
    // Merged setters (pass through to original hooks)
    setAssignees: urlFilters.setAssignees,
    setProjectId: urlFilters.setProjectId,
    setProgramId: urlFilters.setProgramId,
    setTrackId: urlFilters.setTrackId,
    setHypothesisId: urlFilters.setHypothesisId,
    setConditionId: urlFilters.setConditionId,
    setDateFilter: urlFilters.setDateFilter,
    setSelectedWeeks: urlFilters.setSelectedWeeks,
    setSelectedMonths: urlFilters.setSelectedMonths,
    setFilter: localFilters.setFilter,
    clearUrlFilters: urlFilters.clearUrlFilters,
    resetLocal: localFilters.resetLocal,
    // Unified clear
    clearAll,
  };
};
