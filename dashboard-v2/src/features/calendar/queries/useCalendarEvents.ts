import { useMemo } from 'react';
import { useDashboardInit } from '../../../queries/useDashboardInit';
import { useGoogleEvents } from './useGoogleEvents';
import { transformTaskToEvent, getProjectColor } from '../utils/eventTransformers';
import { getWeekRangeByKey, getMonthRangeByKey, isDateInRange } from '@/utils/date';
import {
  VALID_TASK_STATUSES,
  VALID_PRIORITIES,
  VALID_TASK_TYPES,
} from '@/constants/filterDefaults';
import type { BaseCalendarEvent, CalendarRange } from '../types/calendar';
import type { Task } from '@/types';
import type { UseCombinedFiltersReturn } from '@/types/filters';

type CalendarFilters = Pick<UseCombinedFiltersReturn,
    | 'assignees'
    | 'projectId'
    | 'projectIds'
    | 'programId'
    | 'selectedWeeks'
    | 'selectedMonths'
> & Partial<Pick<UseCombinedFiltersReturn,
    | 'taskStatus'
    | 'taskTypes'
    | 'taskPriority'
>>;

interface UseCalendarEventsArgs {
    range: CalendarRange | null;
    enabledCalendarKeys: string[];
    expandMode: boolean;
    filters?: CalendarFilters;
}

/**
 * Check if filter array represents full selection (helper for calendar filtering)
 */
function isFullSelection<T extends string>(
    filterArray: T[],
    validValues: readonly T[]
): boolean {
    if (filterArray.length === 0) return false;
    const validSet = new Set(validValues);
    const filterSet = new Set(filterArray.filter((v) => validSet.has(v)));
    return filterSet.size === validSet.size;
}

export function useCalendarEvents({ range, enabledCalendarKeys, filters }: UseCalendarEventsArgs) {
    // 1. Fetch Loop Tasks
    const { data: dashboardData } = useDashboardInit();
    const tasks = dashboardData?.tasks || [];
    const projects = dashboardData?.projects || [];

    // 2. Fetch Google Events
    const { data: googleEvents = [], isFetching: isGoogleFetching } = useGoogleEvents(range, enabledCalendarKeys);

    // 3. Apply Filters & Transform
    const { events, warnings } = useMemo(() => {
        const mergedEvents: BaseCalendarEvent[] = [];
        const collectWarnings: string[] = [];

        // Apply filters to tasks
        let filteredTasks = tasks;

        if (filters) {
            // Assignee filter (OR logic)
            if (filters.assignees.length > 0) {
                filteredTasks = filteredTasks.filter(t => filters.assignees.includes(t.assignee));
            }

            // Project filter: projectIds > projectId (legacy) > programId
            if (filters.projectIds.length > 0) {
                filteredTasks = filteredTasks.filter(t => filters.projectIds.includes(t.project_id));
            } else if (filters.projectId) {
                // Legacy single project filter
                filteredTasks = filteredTasks.filter(t => t.project_id === filters.projectId);
            } else if (filters.programId) {
                // Handle special "none" value for unassigned projects
                if (filters.programId === 'none') {
                    const unassignedProjectIds = projects
                        .filter(p => !p.program_id)
                        .map(p => p.entity_id);
                    filteredTasks = filteredTasks.filter(t => unassignedProjectIds.includes(t.project_id));
                } else {
                    // Filter by programId (implicit project filtering)
                    const programProjectIds = projects
                        .filter(p => p.program_id === filters.programId)
                        .map(p => p.entity_id);
                    filteredTasks = filteredTasks.filter(t => programProjectIds.includes(t.project_id));
                }
            }

            // Task status filter
            if (filters.taskStatus) {
                if (filters.taskStatus.length === 0) {
                    filteredTasks = []; // Empty = show nothing
                } else if (!isFullSelection(filters.taskStatus, VALID_TASK_STATUSES)) {
                    filteredTasks = filteredTasks.filter(t => filters.taskStatus!.includes(t.status));
                }
                // Full selection = skip filtering
            }

            // Task type filter
            if (filteredTasks.length > 0 && filters.taskTypes) {
                if (filters.taskTypes.length === 0) {
                    filteredTasks = [];
                } else if (!isFullSelection(filters.taskTypes, VALID_TASK_TYPES)) {
                    filteredTasks = filteredTasks.filter(t => t.type && filters.taskTypes!.includes(t.type));
                }
            }

            // Task priority filter
            if (filteredTasks.length > 0 && filters.taskPriority) {
                if (filters.taskPriority.length === 0) {
                    filteredTasks = [];
                } else if (!isFullSelection(filters.taskPriority, VALID_PRIORITIES)) {
                    filteredTasks = filteredTasks.filter(t => filters.taskPriority!.includes(t.priority));
                }
            }

            // Date filters
            if (filters.selectedWeeks.length > 0 || filters.selectedMonths.length > 0) {
                filteredTasks = filteredTasks.filter(t => {
                    if (!t.due) return false; // Hide tasks without due date

                    // Check week filters
                    for (const weekKey of filters.selectedWeeks) {
                        const weekRange = getWeekRangeByKey(weekKey);
                        if (weekRange && isDateInRange(t.due, weekRange.start, weekRange.end)) {
                            return true;
                        }
                    }

                    // Check month filters
                    for (const monthKey of filters.selectedMonths) {
                        const monthRange = getMonthRangeByKey(monthKey);
                        if (monthRange && isDateInRange(t.due, monthRange.start, monthRange.end)) {
                            return true;
                        }
                    }

                    return false;
                });
            }
        }

        // Transform Tasks
        filteredTasks.forEach((task: Task) => {
            const projectColor = getProjectColor(task.project_id, projects);
            const evt = transformTaskToEvent(task, projectColor);
            if (evt) {
                mergedEvents.push(evt);
            }
        });

        // Add Google Events
        googleEvents.forEach(evt => mergedEvents.push(evt));

        // Sort by Order (Google=0, Task=1) then Start Date
        mergedEvents.sort((a, b) => {
            if (a.extendedProps.order !== b.extendedProps.order) {
                return a.extendedProps.order - b.extendedProps.order;
            }
            return a.start.localeCompare(b.start);
        });

        return { events: mergedEvents, warnings: collectWarnings };
    }, [tasks, projects, googleEvents, filters]);

    return {
        events,
        warnings,
        isGoogleFetching
    };
}
