import type { Task, Project } from '@/types';
import type { KanbanColumns } from './components/Kanban/KanbanBoard';
import { getWeekRange, getMonthRange, isWithinRange } from '@/utils/date';

// 1. Filter State Definitions
// URL State (Navigation)
export interface KanbanUrlFilters {
    assignees: string[];       // e.g., ['u1', 'u2']
    projectId: string | null;  // e.g., 'p1'
    dateFilter: 'W' | 'M' | '';
    selectedWeeks: string[];   // e.g., ['2025-W01']
    selectedMonths: string[];  // e.g., ['2025-01']
    trackId: string | null;
    hypothesisId: string | null;
    conditionId: string | null;
}

// Panel State (View Options)
export interface KanbanPanelFilters {
    showInactive: boolean;          // Show inactive tasks/projects
    showDoneProjects: boolean;      // Show completed projects
    taskStatus: string[];           // Selected task statuses
    taskPriority: string[];         // Selected task priorities
    taskTypes: string[];            // Selected task types
    projectStatus: string[];        // Selected project statuses
    projectPriority: string[];      // Selected project priorities
}

export type KanbanFiltersState = KanbanUrlFilters & KanbanPanelFilters;

// 2. Pure Functions for Filtering

/**
 * Apply filters derived from URL parameters (Context-aware navigation)
 */
export const applyUrlFilters = (tasks: Task[], filters: KanbanUrlFilters, projects: Project[] = []): Task[] => {
    const { assignees, projectId, dateFilter, trackId, hypothesisId, conditionId } = filters;
    let filtered = tasks;

    // Assignee filter (Multi-select)
    if (assignees.length > 0) {
        filtered = filtered.filter(t => assignees.includes(t.assignee));
    }

    // Context Filters (Track / Hypothesis / Condition)
    // Requires joining with Project data
    if (trackId || hypothesisId || conditionId) {
        filtered = filtered.filter(t => {
            const project = projects.find(p => p.entity_id === t.project_id);
            if (!project) return false;

            // TODO: Refine mapping logic for Hypotheses/Conditions if they are not 'parent_id'
            // Currently utilizing 'parent_id' for Track matching.
            const matchesTrack = trackId ? project.parent_id === trackId : true;

            // Assuming parent_id might also refer to Hypothesis in some contexts, 
            // or specific logic is needed (e.g. relations table). 
            // For now, strict 'parent_id' matching is the safest bet for Tracks.
            // Hypotheses matching is disabled/placeholder unless we have a specific field.
            const matchesHypothesis = hypothesisId ? project.parent_id === hypothesisId : true;
            const matchesCondition = conditionId ? project.parent_id === conditionId : true;

            return matchesTrack && matchesHypothesis && matchesCondition;
        });
    }

    // Project filter
    if (projectId) {
        filtered = filtered.filter(t => t.project_id === projectId);
    }

    // Date filter (Quick Date)
    if (dateFilter === 'W') {
        const range = getWeekRange();
        filtered = filtered.filter(t => isWithinRange(t.due, range));
    } else if (dateFilter === 'M') {
        const range = getMonthRange();
        filtered = filtered.filter(t => isWithinRange(t.due, range));
    }

    return filtered;
};

/**
 * Apply filters from the Side Panel (View Options)
 */
export const applyPanelFilters = (tasks: Task[], filters: KanbanPanelFilters, _projects: Project[] = []): Task[] => {
    const { taskStatus, taskPriority, taskTypes } = filters;
    let filtered = tasks;

    // 1. Show/Hide Inactive Tasks (Placeholder)
    // if (!showInactive) { ... }

    // 2. Task Status Filter
    if (taskStatus.length > 0) {
        filtered = filtered.filter(t => taskStatus.includes(t.status));
    }

    // 3. Task Priority Filter
    if (taskPriority.length > 0) {
        filtered = filtered.filter(t => taskPriority.includes(t.priority));
    }

    // 4. Task Type Filter
    if (taskTypes.length > 0) {
        filtered = filtered.filter(t => t.type && taskTypes.includes(t.type));
    }

    return filtered;
};

/**
 * Apply Default Business Rules
 * e.g., Hide 'done' projects if no specific status is selected
 */
export const applyDefaultRules = (tasks: Task[], filters: KanbanPanelFilters, projects: Project[] = []): Task[] => {
    let filtered = tasks;
    const { showDoneProjects, projectStatus } = filters;

    // Rule: Hide tasks from 'completed' projects unless explicitly requested
    if (!showDoneProjects && projectStatus.length === 0) {
        // Find IDs of completed projects
        const completedProjectIds = projects
            .filter(p => p.status === 'completed')
            .map(p => p.entity_id);

        if (completedProjectIds.length > 0) {
            filtered = filtered.filter(t => !completedProjectIds.includes(t.project_id));
        }
    }

    // Rule: If specific Project Statuses are selected, filter by them
    if (projectStatus.length > 0) {
        const matchingProjectIds = projects
            .filter(p => projectStatus.includes(p.status))
            .map(p => p.entity_id);

        filtered = filtered.filter(t => matchingProjectIds.includes(t.project_id));
    }

    return filtered;
};

// 3. Grouping Logic

export const groupTasksByStatus = (tasks: Task[]): KanbanColumns => {
    return {
        todo: tasks.filter(t => t.status === 'todo'),
        doing: tasks.filter(t => t.status === 'doing'),
        hold: tasks.filter(t => t.status === 'hold'),
        done: tasks.filter(t => t.status === 'done'),
        blocked: tasks.filter(t => t.status === 'blocked'),
    };
};

// 4. Main Orchestrator

export const buildKanbanColumns = (
    tasks: Task[],
    filters: KanbanFiltersState,
    projects: Project[] = []
): KanbanColumns => {
    // 1. Apply URL Filters (Navigation)
    let filtered = applyUrlFilters(tasks, filters, projects);

    // 2. Apply Panel Filters (View Options)
    filtered = applyPanelFilters(filtered, filters, projects);

    // 3. Apply Default Rules (Business Logic)
    filtered = applyDefaultRules(filtered, filters, projects);

    return groupTasksByStatus(filtered);
};
