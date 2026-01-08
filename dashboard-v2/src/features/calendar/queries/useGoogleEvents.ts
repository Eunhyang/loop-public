import { useQuery } from '@tanstack/react-query';
import { getGoogleEvents } from '../api/google';
import { transformGoogleEvent } from '../utils/eventTransformers';
import type { CalendarRange, GoogleCalendarEvent } from '../types/calendar';

export function useGoogleEvents(
    range: CalendarRange | null,
    enabledCalendarKeys: string[]
) {
    // Parse keys "accountId__calendarId" -> extract "calendarId"
    const calendarIds = enabledCalendarKeys.map(key => {
        const parts = key.split('__');
        return parts.length === 2 ? parts[1] : key;
    });

    return useQuery({
        queryKey: ['googleEvents', range?.start, range?.end, ...calendarIds],
        queryFn: async () => {
            if (!range || calendarIds.length === 0) return [];

            const response = await getGoogleEvents(range.start, range.end, calendarIds);

            // Transform here to avoid re-transforming in render
            const events = response.events
                .map(transformGoogleEvent)
                .filter((e): e is GoogleCalendarEvent => e !== null);

            return events;
        },
        enabled: !!range && calendarIds.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes (Legacy Parity)
    });
}
