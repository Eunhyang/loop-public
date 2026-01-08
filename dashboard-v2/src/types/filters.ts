/**
 * Unified Filter Type System
 *
 * Separates URL-based filters (shareable) from localStorage-based filters (personal preferences)
 */

// ============================================================================
// URL Filter State (Shareable via URL)
// ============================================================================

export type DateFilter = 'W' | 'M' | '';

export interface UrlFilterState {
  // Navigation filters
  assignees: string[];              // Multi-select assignees
  projectId: string | null;         // Single project filter (legacy)
  projectIds: string[];             // Multi-select projects (new UI)
  programId: string | null;         // Program filter: null = All, 'none' = Unassigned, 'pgm-xxx' = Specific
  trackId: string | null;           // Track filter
  hypothesisId: string | null;      // Hypothesis filter
  conditionId: string | null;       // Condition filter (3Y strategy)

  // Date filters
  dateFilter: DateFilter;           // Quick date: 'W' = This Week, 'M' = This Month, '' = None
  selectedWeeks: string[];          // Selected week ranges (e.g., ['2025-W01'])
  selectedMonths: string[];         // Selected month ranges (e.g., ['2025-01'])
}

// ============================================================================
// Local Filter State (Personal preferences in localStorage)
// ============================================================================

export interface LocalFilterState {
  // Visibility toggles
  showInactiveMembers: boolean;     // Show inactive team members
  showNonCoreMembers: boolean;      // Show non-core members (default: false = core only)
  showInactiveProjects: boolean;    // Show inactive projects

  // Project filters
  projectStatus: string[];          // Selected project statuses (default: excludes 'done')
  projectPriority: string[];        // Selected project priorities

  // Task filters
  taskStatus: string[];             // Selected task statuses
  taskPriority: string[];           // Selected task priorities
  taskTypes: string[];              // Selected task types (dev, design, etc.)

  // Date range (custom range)
  dueDateStart: string | null;      // Start date (YYYY-MM-DD)
  dueDateEnd: string | null;        // End date (YYYY-MM-DD)
}

// ============================================================================
// Combined Filter State (Merged from URL + localStorage)
// ============================================================================

export interface CombinedFilterState extends UrlFilterState, LocalFilterState {
  // Utility methods
  clearAll?: () => void;            // Clear both URL and localStorage filters
}

// ============================================================================
// Filter Setters (for hooks)
// ============================================================================

export interface UrlFilterSetters {
  setAssignees: (values: string[]) => void;
  setProjectId: (id: string | null) => void;
  setProjectIds: (ids: string[]) => void;
  toggleProjectId: (id: string) => void;
  setProgramId: (id: string | null) => void;
  setTrackId: (id: string | null) => void;
  setHypothesisId: (id: string | null) => void;
  setConditionId: (id: string | null) => void;
  setDateFilter: (filter: DateFilter) => void;
  setSelectedWeeks: (values: string[]) => void;
  setSelectedMonths: (values: string[]) => void;
  clearUrlFilters: () => void;
}

export interface LocalFilterSetters {
  setFilter: <K extends keyof LocalFilterState>(key: K, value: LocalFilterState[K]) => void;
  resetLocal: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseUrlFiltersReturn extends UrlFilterState, UrlFilterSetters {}

export interface UseLocalFiltersReturn extends LocalFilterState, LocalFilterSetters {}

export interface UseCombinedFiltersReturn
  extends CombinedFilterState,
    UrlFilterSetters,
    LocalFilterSetters {
  clearAll: () => void;
}
