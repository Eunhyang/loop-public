export type CalendarEventType = 'task' | 'google';

/**
 * Calendar Range
 * Normalized to YYYY-MM-DD
 * End date is exclusive (following FullCalendar convention)
 * Timezone is typically 'Asia/Seoul'
 */
export interface CalendarRange {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
    timezone?: string;
}

/**
 * Base Event Interface
 * strictly compatible with FullCalendar Input
 */
export interface BaseCalendarEvent {
    id: string;
    title: string;
    start: string;      // ISO 8601
    end?: string;       // ISO 8601
    allDay?: boolean;
    editable?: boolean;
    classNames?: string[];
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;

    // Custom props
    extendedProps: {
        type: CalendarEventType;
        order: number;    // Legacy Parity: Google=0, Task=1
        [key: string]: any;
    };
}

/**
 * Task Event
 * order: 1, editable: true
 */
export interface TaskCalendarEvent extends BaseCalendarEvent {
    extendedProps: {
        type: 'task';
        order: 1;
        taskId: string;
        status: string;
        priority: string;
        projectId: string; // Can be null if orphaned
        assigneeId: string;
    };
}

/**
 * Google Event
 * order: 0, editable: false
 */
export interface GoogleCalendarEvent extends BaseCalendarEvent {
    extendedProps: {
        type: 'google';
        order: 0;
        calendarId: string;
        calendarName: string;
        htmlLink?: string;
        location?: string;
        description?: string;
    };
}
