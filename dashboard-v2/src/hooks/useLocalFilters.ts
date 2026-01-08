/**
 * useLocalFilters Hook
 *
 * React 18 useSyncExternalStore pattern for localStorage-based filter preferences.
 *
 * Key change from previous implementation:
 * - Before: Each hook call created independent useState → different instances
 * - After: All hook calls share the same external store → synchronized state
 *
 * This ensures FilterPanel and KanbanPage always see the same filter state.
 */

import { useSyncExternalStore, useCallback } from 'react';
import type { LocalFilterState, UseLocalFiltersReturn } from '@/types/filters';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setFilter as storeSetFilter,
  resetLocal as storeResetLocal,
} from '@/stores/localFilterStore';

/**
 * Hook for managing localStorage-based filter preferences
 *
 * Uses useSyncExternalStore to ensure all components share the same state.
 * Changes made in FilterPanel will immediately reflect in KanbanPage.
 */
export const useLocalFilters = (): UseLocalFiltersReturn => {
  // Subscribe to the external store
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Stable setFilter callback
  const setFilter = useCallback(
    <K extends keyof LocalFilterState>(key: K, value: LocalFilterState[K]) => {
      storeSetFilter(key, value);
    },
    []
  );

  // Stable resetLocal callback
  const resetLocal = useCallback(() => {
    storeResetLocal();
  }, []);

  return {
    ...state,
    setFilter,
    resetLocal,
  };
};
