/**
 * FilterContext - Panel State Only
 *
 * This context now only manages the filter panel open/close state.
 * All filter values (taskStatus, projectStatus, etc.) have been moved to
 * localFilterStore and are accessed via useCombinedFilters hook.
 *
 * Migration (tsk-023-16):
 * - Filter state: FilterContext → localFilterStore (useCombinedFilters)
 * - Panel state: Remains in FilterContext (isPanelOpen, togglePanel)
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface FilterContextType {
  isPanelOpen: boolean;
  togglePanel: () => void;
  // Legacy methods kept for backward compatibility (no-op)
  resetFilters: () => void;
  setFilter: (key: string, value: unknown) => void;
  toggleFilterArray: (key: string, value: string) => void;
  // Legacy filter values (always empty, use useCombinedFilters instead)
  taskStatus: string[];
  taskPriority: string[];
  taskTypes: string[];
  projectStatus: string[];
  projectPriority: string[];
  showInactive: boolean;
  showDoneProjects: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

  // Legacy no-op methods (actual filter state is in localFilterStore)
  const resetFilters = useCallback(() => {
    console.warn('[FilterContext] resetFilters is deprecated. Use useCombinedFilters().resetLocal() instead.');
  }, []);

  const setFilter = useCallback((_key: string, _value: unknown) => {
    console.warn('[FilterContext] setFilter is deprecated. Use useCombinedFilters().setFilter() instead.');
  }, []);

  const toggleFilterArray = useCallback((_key: string, _value: string) => {
    console.warn('[FilterContext] toggleFilterArray is deprecated. Use useCombinedFilters().setFilter() instead.');
  }, []);

  const value = useMemo<FilterContextType>(() => ({
    isPanelOpen,
    togglePanel,
    // Legacy methods (no-op)
    resetFilters,
    setFilter,
    toggleFilterArray,
    // Legacy values (always empty)
    taskStatus: [],
    taskPriority: [],
    taskTypes: [],
    projectStatus: [],
    projectPriority: [],
    showInactive: true,
    showDoneProjects: false,
  }), [isPanelOpen, togglePanel, resetFilters, setFilter, toggleFilterArray]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
