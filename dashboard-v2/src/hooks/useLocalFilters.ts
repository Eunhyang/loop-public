/**
 * useLocalFilters Hook
 *
 * Manages personal filter preferences in localStorage with debounced writes
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { LocalFilterState, UseLocalFiltersReturn } from '@/types/filters';
import { DEFAULT_LOCAL_FILTERS, FILTER_STORAGE_KEY } from '@/constants/filterDefaults';

/**
 * Simple debounce implementation
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced;
}

/**
 * Hydrate state from localStorage on mount
 */
function hydrateFromStorage(): LocalFilterState {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return DEFAULT_LOCAL_FILTERS;

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle schema changes
    return { ...DEFAULT_LOCAL_FILTERS, ...parsed };
  } catch (error) {
    console.error('Failed to hydrate filters from localStorage:', error);
    return DEFAULT_LOCAL_FILTERS;
  }
}

/**
 * Hook for managing localStorage-based filter preferences
 */
export const useLocalFilters = (): UseLocalFiltersReturn => {
  // Hydrate once on mount
  const [state, setState] = useState<LocalFilterState>(() => hydrateFromStorage());

  // Debounced write to localStorage (500ms)
  const debouncedWrite = useMemo(
    () =>
      debounce((value: LocalFilterState) => {
        try {
          localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(value));
        } catch (error) {
          console.error('Failed to write filters to localStorage:', error);
        }
      }, 500),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedWrite.cancel();
    };
  }, [debouncedWrite]);

  // Setter for individual filter fields
  const setFilter = useCallback(
    <K extends keyof LocalFilterState>(key: K, value: LocalFilterState[K]) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        debouncedWrite(next);
        return next;
      });
    },
    [debouncedWrite]
  );

  // Reset to defaults
  const resetLocal = useCallback(() => {
    // Cancel any pending debounced writes to prevent stale data overwriting
    debouncedWrite.cancel();
    setState(DEFAULT_LOCAL_FILTERS);
    try {
      localStorage.removeItem(FILTER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove filters from localStorage:', error);
    }
  }, [debouncedWrite]);

  return {
    ...state,
    setFilter,
    resetLocal,
  };
};
