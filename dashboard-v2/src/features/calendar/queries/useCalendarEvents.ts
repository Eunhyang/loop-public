import { useMemo } from 'react';
import { useDashboardInit } from '../../../queries/useDashboardInit';
import { useGoogleEvents } from './useGoogleEvents';
import { transformTaskToEvent, getProjectColor } from '../utils/eventTransformers';
import type { BaseCalendarEvent, CalendarRange } from '../types/calendar';
import type { Task } from '@/types';

interface UseCalendarEventsArgs {
    range: CalendarRange | null;
    enabledCalendarKeys: string[];
    expandMode: boolean;
    filters?: {
        assignees: string[];
        projectIds: string[];
        programId: string | null;
        selectedWeeks: string[];
        selectedMonths: string[];
    };
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

            // Project filter: projectIds takes precedence over programId
            if (filters.projectIds.length > 0) {
                filteredTasks = filteredTasks.filter(t => filters.projectIds.includes(t.project_id));
            } else if (filters.programId) {
                // Filter by programId (implicit project filtering)
                const programProjectIds = projects
                    .filter(p => p.program_id === filters.programId)
                    .map(p => p.entity_id);
                filteredTasks = filteredTasks.filter(t => programProjectIds.includes(t.project_id));
            }
        }

        // Transform Tasks
        filteredTasks.forEach((task: Task) => {
            const evt = transformTaskToEvent(task, getProjectColor(task.project_id));
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
