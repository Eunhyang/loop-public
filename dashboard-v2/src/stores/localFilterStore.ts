/**
 * Local Filter Store
 *
 * External store for localStorage-based filter state.
 * Uses React 18 useSyncExternalStore pattern for cross-component synchronization.
 *
 * Why this pattern?
 * - Each useCombinedFilters() call was creating independent useState instances
 * - FilterPanel and KanbanPage had different state copies
 * - Changes in FilterPanel didn't reflect in KanbanPage without page refresh
 *
 * Solution:
 * - Single store instance shared across all components
 * - Subscribers are notified on any state change
 * - useSyncExternalStore ensures React re-renders when store changes
 */

import type { LocalFilterState } from '@/types/filters';
import { DEFAULT_LOCAL_FILTERS, FILTER_STORAGE_KEY } from '@/constants/filterDefaults';

// ============================================================================
// Store State
// ============================================================================

type Listener = () => void;

let state: LocalFilterState = loadFromStorage();
let listeners: Set<Listener> = new Set();

// ============================================================================
// Storage Helpers
// ============================================================================

function loadFromStorage(): LocalFilterState {
  try {
    if (typeof window === 'undefined') return DEFAULT_LOCAL_FILTERS;
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return DEFAULT_LOCAL_FILTERS;
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle schema changes
    return { ...DEFAULT_LOCAL_FILTERS, ...parsed };
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
    return DEFAULT_LOCAL_FILTERS;
  }
}

function saveToStorage(value: LocalFilterState): void {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

// ============================================================================
// Store API
// ============================================================================

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Get current snapshot of the store state
 * Used by useSyncExternalStore
 */
export function getSnapshot(): LocalFilterState {
  return state;
}

/**
 * Get server snapshot (for SSR)
 * Returns default filters since localStorage isn't available on server
 */
export function getServerSnapshot(): LocalFilterState {
  return DEFAULT_LOCAL_FILTERS;
}

/**
 * Subscribe to store changes
 * Used by useSyncExternalStore
 *
 * @param listener - Callback to invoke when state changes
 * @returns Unsubscribe function
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Set a single filter field
 *
 * @param key - Field name to update
 * @param value - New value
 */
export function setFilter<K extends keyof LocalFilterState>(
  key: K,
  value: LocalFilterState[K]
): void {
  state = { ...state, [key]: value };
  saveToStorage(state);
  emitChange();
}

/**
 * Reset all filters to defaults
 */
export function resetLocal(): void {
  state = DEFAULT_LOCAL_FILTERS;
  try {
    localStorage.removeItem(FILTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove filters from localStorage:', error);
  }
  emitChange();
}

// ============================================================================
// Export store object for convenience
// ============================================================================

export const localFilterStore = {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  setFilter,
  resetLocal,
};
