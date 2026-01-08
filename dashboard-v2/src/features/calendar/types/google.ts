/**
 * Google Calendar Model
 */
export interface GoogleCalendar {
    id: string;        // "calendarId"
    summary: string;   // Calendar Name
    color?: string;    // Hex color
    primary?: boolean;
    accessRole?: string;
}

/**
 * Google Account Model (Grouping)
 */
export interface GoogleCalendarAccount {
    accountId: string; // "user_id" from OAuth
    email: string;
    calendars: GoogleCalendar[];
    // UI usage: "isCollapsed" might be stored separately in local state
}

/**
 * API Response: /api/google/calendars
 * The legacy API returns { calendars: [...] } flat list
 * We will need to group them on the client side
 */
export interface GoogleCalendarsApiResponse {
    calendars: (GoogleCalendar & {
        account_id: string;
        account_email: string;
    })[];
}

/**
 * API Response: /api/google/events
 */
export interface GoogleEventsApiResponse {
    events: {
        id: string;
        summary: string;
        start: { dateTime?: string; date?: string; };
        end: { dateTime?: string; date?: string; };
        htmlLink?: string;
        location?: string;
        description?: string;
        // ... other fields from Google API

        // Legacy API might inject these:
        calendar_id?: string;
        account_id?: string;
    }[];
}
