import { httpClient } from '../../../services/http';
import type { GoogleCalendarsApiResponse, GoogleEventsApiResponse } from '../types/google';

/**
 * Fetch Google Calendars (and Accounts)
 * GET /api/google/calendars
 */
export async function getGoogleCalendars(): Promise<GoogleCalendarsApiResponse> {
    const { data } = await httpClient.get<GoogleCalendarsApiResponse>('/api/google/calendars');
    return data;
}

/**
 * Fetch Google Events
 * GET /api/google/events?start=YYYY-MM-DD&end=YYYY-MM-DD&calendar_ids=...
 */
export async function getGoogleEvents(
    start: string,
    end: string,
    calendarIds: string[]
): Promise<GoogleEventsApiResponse> {
    if (!calendarIds.length) {
        return { events: [] };
    }

    const params = new URLSearchParams();
    params.append('start', start);
    params.append('end', end);
    // Server expects comma-separated calendar IDs (not accountId__calendarId)
    params.append('calendar_ids', calendarIds.join(','));

    const { data } = await httpClient.get<GoogleEventsApiResponse>('/api/google/events', {
        params
    });
    return data;
}
