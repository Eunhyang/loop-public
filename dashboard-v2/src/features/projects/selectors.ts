import type { Project } from '@/types';
import type { KanbanPanelFilters } from '@/features/tasks/selectors';

/**
 * Get Allowed Project IDs based on Panel Filters (View Options)
 * This logic handles:
 * 1. "Show Done Projects" toggle
 * 2. Specific "Project Status" filters
 * 3. Specific "Project Priority" filters
 */
export const getAllowedProjectIds = (projects: Project[], filters: KanbanPanelFilters): string[] => {
    const { showDoneProjects, projectStatus, projectPriority } = filters;

    let allowedProjects = projects;

    // 1. Hide 'done' projects if 'showDoneProjects' is false
    // AND no specific project status is being filtered.
    // (If a user specifically asks for 'completed' status, we should show it regardless of the toggle)
    if (!showDoneProjects && projectStatus.length === 0) {
        allowedProjects = allowedProjects.filter(p => p.status !== 'completed');
    }

    // 2. Filter by Project Status
    if (projectStatus.length > 0) {
        allowedProjects = allowedProjects.filter(p => projectStatus.includes(p.status));
    }

    // 3. Filter by Project Priority
    if (projectPriority.length > 0) {
        allowedProjects = allowedProjects.filter(p => projectPriority.includes(p.priority_flag ?? '')); // Assuming priority_flag matches
    }

    return allowedProjects.map(p => p.entity_id);
};
