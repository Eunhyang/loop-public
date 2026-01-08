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
  assignees: [],
  projectId: null,
  projectIds: [],
  programId: null,
  trackId: null,
  hypothesisId: null,
  conditionId: null,

  // Date filters
  dateFilter: '',
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
  projectStatus: ['planning', 'active', 'paused', 'cancelled'], // Exclude 'completed'
  projectPriority: [],              // Empty = all priorities

  // Task filters (legacy: all statuses/priorities/types)
  taskStatus: [],                   // Empty = all statuses
  taskPriority: [],                 // Empty = all priorities
  taskTypes: [],                    // Empty = all types

  // Date range (custom range)
  dueDateStart: null,
  dueDateEnd: null,
};

// ============================================================================
// localStorage Key
// ============================================================================

export const FILTER_STORAGE_KEY = 'dashboard-filters-v2';

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
