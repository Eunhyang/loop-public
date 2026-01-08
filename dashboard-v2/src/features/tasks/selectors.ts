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
    const { assignees, projectId, dateFilter, selectedWeeks, selectedMonths, trackId, hypothesisId, conditionId } = filters;
    let filtered = tasks;

    // Assignee filter (Multi-select)
    if (assignees.length > 0) {
        filtered = filtered.filter(t => assignees.includes(t.assignee));
    }

    // Context Filters (Track / Hypothesis / Condition)
    if (trackId || hypothesisId || conditionId) {
        // Build a map for O(1) project lookup (performance & safety)
        const projectById = new Map(projects.map(p => [p.entity_id, p] as [string, Project]));
        filtered = filtered.filter(t => {
            const project = projectById.get(t.project_id);
            if (!project) return false; // Exclude tasks whose project is missing when any filter is active

            // Accumulate AND logic
            let match = true;
            if (trackId) {
                match = match && (project.parent_id === trackId);
            }
            if (conditionId) {
                match = match && (project.conditions_3y?.includes(conditionId) ?? false);
            }
            if (hypothesisId) {
                const hypMatch = (project.validates?.includes(hypothesisId) ?? false) ||
                    (project.primary_hypothesis_id === hypothesisId);
                match = match && hypMatch;
            }
            return match;
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

    // Selected Weeks filter (Multi-select)
    if (selectedWeeks.length > 0) {
        filtered = filtered.filter(t => {
            if (!t.due) return false;
            const taskDate = new Date(t.due);
            const taskYear = taskDate.getFullYear();
            const taskWeek = Math.ceil((((taskDate.getTime() - new Date(taskYear, 0, 1).getTime()) / 86400000) + new Date(taskYear, 0, 1).getDay() + 1) / 7);
            const formattedWeek = `${taskYear}-W${String(taskWeek).padStart(2, '0')}`;
            return selectedWeeks.includes(formattedWeek);
        });
    }

    // Selected Months filter (Multi-select)
    if (selectedMonths.length > 0) {
        filtered = filtered.filter(t => {
            if (!t.due) return false;
            const taskDate = new Date(t.due);
            const taskYear = taskDate.getFullYear();
            const taskMonth = taskDate.getMonth() + 1; // getMonth() is 0-indexed
            const formattedMonth = `${taskYear}-${String(taskMonth).padStart(2, '0')}`;
            return selectedMonths.includes(formattedMonth);
        });
    }

    return filtered;
};

/**
 * Apply filters from the Side Panel (View Options)
 */
export const applyPanelFilters = (tasks: Task[], filters: KanbanPanelFilters): Task[] => {
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
 * Filter Tasks by Allowed Project IDs
 * STRICT Separation: This function relies on `allowedProjectIds` calculated by Projects logic.
 */
export const filterTasksByProjects = (tasks: Task[], allowedProjectIds: string[]): Task[] => {
    return tasks.filter(t => allowedProjectIds.includes(t.project_id));
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

import { getAllowedProjectIds } from '@/features/projects/selectors';

// 4. Main Orchestrator

export const buildKanbanColumns = (
    tasks: Task[],
    filters: KanbanFiltersState,
    projects: Project[] = []
): KanbanColumns => {
    // 1. Calculate Allowed Projects (Project Domain Logic)
    const allowedProjectIds = getAllowedProjectIds(projects, filters);

    // 2. Apply Task Filters + Project Constraints
    let filtered = tasks;

    // Apply URL Filters
    filtered = applyUrlFilters(filtered, filters, projects);

    // Apply Panel Filters
    filtered = applyPanelFilters(filtered, filters);

    // Apply Project Constraints
    filtered = filterTasksByProjects(filtered, allowedProjectIds);

    return groupTasksByStatus(filtered);
};
