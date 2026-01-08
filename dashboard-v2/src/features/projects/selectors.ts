import type { Project } from '@/types';
import type { LocalFilterState } from '@/types/filters';
import { VALID_PRIORITIES } from '@/constants/filterDefaults';

/**
 * Phase 1: Project Filtering
 *
 * Filters projects based on:
 * 1. Visibility toggles (inactive projects)
 * 2. Project status filters
 * 3. Project priority filters
 *
 * Returns array of allowed project IDs for Phase 2 task filtering
 */
export const filterProjects = (projects: Project[], filters: LocalFilterState): string[] => {
  const { showInactiveProjects, projectStatus, projectPriority } = filters;

  let allowedProjects = projects;

  // 1. Filter inactive projects (if showInactiveProjects is false)
  // Project.status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  if (!showInactiveProjects) {
    // Filter out 'completed' status as inactive (matches legacy behavior)
    allowedProjects = allowedProjects.filter((p) => p.status !== 'completed');
  }

  // 2. Filter by Project Status (if specific statuses selected)
  if (projectStatus.length > 0) {
    allowedProjects = allowedProjects.filter((p) => projectStatus.includes(p.status));
  }

  // 3. Filter by Project Priority (full-selection semantics)
  if (projectPriority.length === 0) {
    // Empty = show NOTHING
    return [];
  } else {
    // Check if full selection (use Set comparison)
    const validSet = new Set<string>(VALID_PRIORITIES);
    const filterSet = new Set(projectPriority.filter((p) => validSet.has(p)));
    const isFullSelection = filterSet.size === validSet.size;

    if (!isFullSelection) {
      // Partial selection = apply filter (includes null check)
      allowedProjects = allowedProjects.filter((p) =>
        projectPriority.includes(p.priority_flag ?? '')
      );
    }
    // Full selection = skip filtering (show all, including null priorities)
  }

  return allowedProjects.map((p) => p.entity_id);
};

/**
 * @deprecated Use filterProjects() instead
 * Kept for backward compatibility
 */
export const getAllowedProjectIds = filterProjects;
