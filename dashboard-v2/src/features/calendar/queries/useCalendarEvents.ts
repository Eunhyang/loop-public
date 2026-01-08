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
}

export function useCalendarEvents({ range, enabledCalendarKeys }: UseCalendarEventsArgs) {
    // 1. Fetch Loop Tasks
    const { data: dashboardData } = useDashboardInit();
    const tasks = dashboardData?.tasks || [];

    // 2. Fetch Google Events
    const { data: googleEvents = [], isFetching: isGoogleFetching } = useGoogleEvents(range, enabledCalendarKeys);

    // 3. Merge & Transform
    const { events, warnings } = useMemo(() => {
        const mergedEvents: BaseCalendarEvent[] = [];
        const collectWarnings: string[] = [];

        // Transform Tasks
        tasks.forEach((task: Task) => {
            // Optional: Filter logic (legacy parity)
            // e.g. Hide done tasks that haven't been updated recently?
            // For now, we map everything and rely on transformer validation

            const evt = transformTaskToEvent(task, getProjectColor(task.project_id));
            if (evt) {
                mergedEvents.push(evt);
            } else {
                // Warning collected inside transformer (console.warn)
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
    }, [tasks, googleEvents]);

    return {
        events,
        warnings,
        isGoogleFetching
    };
}
