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
import {
  DEFAULT_LOCAL_FILTERS,
  FILTER_STORAGE_KEY,
  FILTER_SCHEMA_VERSION,
} from '@/constants/filterDefaults';

// ============================================================================
// Store State
// ============================================================================

type Listener = () => void;

/**
 * Internal storage format with schema version for migrations
 */
interface StoredFilterState extends LocalFilterState {
  _schemaVersion?: number;
}

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

    const parsed: StoredFilterState = JSON.parse(stored);

    // One-time migration: Only upgrade legacy data (v0 or no version)
    if (!parsed._schemaVersion || parsed._schemaVersion < FILTER_SCHEMA_VERSION) {
      console.log('[Filter Migration] Migrating from v', parsed._schemaVersion || 0, 'to v', FILTER_SCHEMA_VERSION);

      // v1: Migrate empty arrays to full defaults (legacy behavior meant "show all")
      if (parsed.taskStatus?.length === 0) {
        console.log('[Filter Migration] taskStatus: [] → full array');
        parsed.taskStatus = DEFAULT_LOCAL_FILTERS.taskStatus;
      }
      if (parsed.taskPriority?.length === 0) {
        console.log('[Filter Migration] taskPriority: [] → full array');
        parsed.taskPriority = DEFAULT_LOCAL_FILTERS.taskPriority;
      }
      if (parsed.taskTypes?.length === 0) {
        console.log('[Filter Migration] taskTypes: [] → full array');
        parsed.taskTypes = DEFAULT_LOCAL_FILTERS.taskTypes;
      }
      if (parsed.projectPriority?.length === 0) {
        console.log('[Filter Migration] projectPriority: [] → full array');
        parsed.projectPriority = DEFAULT_LOCAL_FILTERS.projectPriority;
      }

      // Mark as migrated
      parsed._schemaVersion = FILTER_SCHEMA_VERSION;

      // Save migrated data (only if not in SSR)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(parsed));
          console.log('[Filter Migration] Migration saved to localStorage');
        } catch (error) {
          console.warn('[Filter Migration] Failed to save migrated data:', error);
        }
      }
    }

    // Remove internal field before returning
    const { _schemaVersion, ...filterState } = parsed;

    // Merge with defaults to handle schema changes
    return { ...DEFAULT_LOCAL_FILTERS, ...filterState };
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
    return DEFAULT_LOCAL_FILTERS;
  }
}

function saveToStorage(value: LocalFilterState): void {
  try {
    // Always include version when saving
    const toSave: StoredFilterState = {
      ...value,
      _schemaVersion: FILTER_SCHEMA_VERSION,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

// ============================================================================
// Store API
// ============================================================================

function emitChange(): void {
  console.log('[Store] emitChange called, listeners count:', listeners.size);
  listeners.forEach((listener) => {
    console.log('[Store] Calling listener');
    listener();
  });
}

/**
 * Get current snapshot of the store state
 * Used by useSyncExternalStore
 */
export function getSnapshot(): LocalFilterState {
  console.log('[Store] getSnapshot called, showInactiveMembers:', state.showInactiveMembers);
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
  console.log('[Store] subscribe called, listeners before:', listeners.size);
  listeners.add(listener);
  console.log('[Store] subscribe done, listeners after:', listeners.size);
  return () => {
    console.log('[Store] unsubscribe called');
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
  console.log('[Store] setFilter called:', key, '=', value);
  const oldState = state;
  state = { ...state, [key]: value };
  console.log('[Store] state changed:', oldState === state ? 'SAME REF (BUG!)' : 'NEW REF (OK)');
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
