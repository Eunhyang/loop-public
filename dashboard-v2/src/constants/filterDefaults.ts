/**
 * Filter Default Values
 *
 * Defines default filter states matching legacy dashboard behavior
 * Updated to use Constants from API SSOT instead of hardcoded arrays
 */

import type { UrlFilterState, LocalFilterState } from '@/types/filters';
import type { Constants } from '@/types/constants';

// ============================================================================
// URL Filter Defaults (Empty state)
// ============================================================================

export const DEFAULT_URL_FILTERS: UrlFilterState = {
  // Navigation filters
  assignees: ['김은향', '한명학'], // Default: Core members only
  projectId: null,
  projectIds: [],
  programId: null,
  trackId: null,
  hypothesisId: null,
  conditionId: null,

  // Date filters
  dateFilter: 'W', // Default: This Week
  selectedWeeks: [],
  selectedMonths: [],
};

// ============================================================================
// Local Filter Defaults (Factory Function using Constants from API)
// ============================================================================

/**
 * createDefaultLocalFilters
 *
 * Factory function that creates default local filter state based on Constants from API SSOT.
 * This replaces hardcoded VALID_* arrays with dynamic values from schema_constants.yaml.
 *
 * @param constants - Constants object from /api/dashboard-init
 * @returns LocalFilterState with default values
 */
export const createDefaultLocalFilters = (constants: Constants): LocalFilterState => ({
  // Visibility toggles (legacy: show core members only, hide inactive)
  showInactiveMembers: false,
  showNonCoreMembers: false,        // Default: core members only (matches legacy)
  showInactiveProjects: false,

  // Project filters - use all statuses from API constants
  // Users can toggle individual status buttons in FilterPanel
  projectStatus: constants.project.status,
  projectPriority: constants.priority.values, // Full selection = show all

  // Task filters (full selection = show all, active UI state)
  taskStatus: constants.task.status,          // Full = show all
  taskPriority: constants.priority.values,    // Full = show all
  taskTypes: constants.task.types,            // Full = show all

  // Date range (custom range)
  dueDateStart: null,
  dueDateEnd: null,
});

/**
 * @deprecated Use createDefaultLocalFilters(constants) instead
 *
 * This constant is kept temporarily for backwards compatibility.
 * It will be removed once all callsites migrate to the factory function.
 */
export const DEFAULT_LOCAL_FILTERS: LocalFilterState = {
  showInactiveMembers: false,
  showNonCoreMembers: false,
  showInactiveProjects: false,
  projectStatus: ['planning', 'active', 'paused', 'cancelled'], // Fixed: removed 'doing'
  projectPriority: ['critical', 'high', 'medium', 'low'],
  taskStatus: ['todo', 'doing', 'hold', 'done', 'blocked'],
  taskPriority: ['critical', 'high', 'medium', 'low'],
  taskTypes: ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'],
  dueDateStart: null,
  dueDateEnd: null,
};

// ============================================================================
// localStorage Key & Schema Version
// ============================================================================

export const FILTER_STORAGE_KEY = 'dashboard-filters-v2';

/**
 * Schema version for filter migration
 * v1: Changed empty arrays to full arrays for better UX (all buttons active by default)
 */
export const FILTER_SCHEMA_VERSION = 1;

// ============================================================================
// Constants for validation (DEPRECATED - use Constants from API SSOT)
// ============================================================================

/**
 * @deprecated Use constants.project.status from API SSOT instead
 *
 * Kept temporarily for backwards compatibility.
 * Migrate to: const { project } = useConstants(); project.status
 */
export const VALID_PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'] as const;

/**
 * @deprecated Use constants.task.status from API SSOT instead
 *
 * Kept temporarily for backwards compatibility.
 * Migrate to: const { task } = useConstants(); task.status
 */
export const VALID_TASK_STATUSES = ['todo', 'doing', 'hold', 'done', 'blocked'] as const;

/**
 * @deprecated Use constants.priority.values from API SSOT instead
 *
 * Kept temporarily for backwards compatibility.
 * Migrate to: const { priority } = useConstants(); priority.values
 */
export const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

/**
 * @deprecated Use constants.task.types from API SSOT instead
 *
 * Kept temporarily for backwards compatibility.
 * Migrate to: const { task } = useConstants(); task.types
 */
export const VALID_TASK_TYPES = ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'] as const;
