/**
 * Filter Default Values
 *
 * Defines default filter states matching legacy dashboard behavior
 */

import type { UrlFilterState, LocalFilterState } from '@/types/filters';

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
// Local Filter Defaults (Legacy dashboard behavior)
// ============================================================================

export const DEFAULT_LOCAL_FILTERS: LocalFilterState = {
  // Visibility toggles (legacy: show core members only, hide inactive)
  showInactiveMembers: false,
  showNonCoreMembers: false,        // Default: core members only (matches legacy)
  showInactiveProjects: false,

  // Project filters (legacy: exclude 'completed' projects)
  // Project.status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  // Note: 'doing' added for backwards compat (some projects use Task status)
  projectStatus: ['planning', 'active', 'doing', 'paused', 'cancelled'], // Exclude 'completed'
  projectPriority: ['critical', 'high', 'medium', 'low'], // Full selection = show all

  // Task filters (full selection = show all, active UI state)
  taskStatus: ['todo', 'doing', 'hold', 'done', 'blocked'], // Full = show all
  taskPriority: ['critical', 'high', 'medium', 'low'],       // Full = show all
  taskTypes: ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'], // Full = show all

  // Date range (custom range)
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
// Constants for validation
// ============================================================================

// Project.status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
export const VALID_PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'] as const;

// Task.status: 'todo' | 'doing' | 'hold' | 'done' | 'blocked'
export const VALID_TASK_STATUSES = ['todo', 'doing', 'hold', 'done', 'blocked'] as const;

// Task.priority: 'critical' | 'high' | 'medium' | 'low'
export const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

// Task.type: 'dev' | 'bug' | 'strategy' | 'research' | 'ops' | 'meeting' | null
export const VALID_TASK_TYPES = ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'] as const;
