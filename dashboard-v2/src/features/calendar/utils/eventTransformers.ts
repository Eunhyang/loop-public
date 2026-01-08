
import type {
    TaskCalendarEvent,
    GoogleCalendarEvent
} from '../types/calendar';
import { isValidDateString, adjustEndDateExclusive } from './range';
import type { Task } from '@/types';

/**
 * Colors (Legacy Parity)
 */
const DEFAULT_COLOR = '#E0E0E0';

// Mock function for getting color (Replace with real logic relying on Project State)
export function getProjectColor(projectId?: string): string {
    if (!projectId) return DEFAULT_COLOR;
    // TODO: connect to Project Store or pass projects map
    // Logic: Project -> Parent Track -> Color
    return DEFAULT_COLOR;
}

/**
 * Transform Task to Calendar Event
 * Strict Validation: DROP invalid dates
 */
export function transformTaskToEvent(task: Task, projectColor = DEFAULT_COLOR): TaskCalendarEvent | null {
    // 1. Determine Start Date
    const rawStart = task.start_date || task.due;
    if (!isValidDateString(rawStart)) {
        console.warn('[Calendar] Invalid start date for task', task.entity_id, rawStart);
        return null; // DROP
    }
    const start = rawStart!;

    // 2. Determine End Date
    const rawEnd = task.due || task.start_date;
    // If start is valid but end is invalid, we could default end=start, or drop?
    // Strategy: Default to start (single day)
    const safeEnd = isValidDateString(rawEnd) ? rawEnd! : start;

    // 3. Adjust Exclusive End
    const end = adjustEndDateExclusive(start, safeEnd);

    return {
        id: task.entity_id,
        title: task.entity_name,
        start,
        end,
        backgroundColor: projectColor,
        borderColor: projectColor,
        textColor: '#374151', // Gray-700
        classNames: task.status === 'done' ? ['opacity-50', 'line-through'] : [],
        editable: true, // Task is editable
        extendedProps: {
            type: 'task',
            order: 1, // Order 1 (Below Google)
            taskId: task.entity_id,
            status: task.status,
            priority: task.priority,
            projectId: task.project_id,
            assigneeId: task.assignee,
        }
    };
}

/**
 * Transform Google Event
 */
export function transformGoogleEvent(gEvent: any): GoogleCalendarEvent | null {
    // Parsing Google API format
    // start.date (All Day) or start.dateTime (Timed)
    const isAllDay = !!gEvent.start.date;
    const startRaw = gEvent.start.date || gEvent.start.dateTime;
    const endRaw = gEvent.end.date || gEvent.end.dateTime;

    if (!startRaw) return null;

    // Convert to ISO string (FullCalendar handles ISO well)
    // But for Parity, we might want to normalize to YYYY-MM-DD for consistency?
    // Actually FullCalendar handles ISO with timezone just fine.
    // Exception: All Day events come as YYYY-MM-DD from Google.

    return {
        id: gEvent.id,
        title: gEvent.summary || '(No Title)',
        start: startRaw,
        end: endRaw,
        allDay: isAllDay,
        editable: false, // Read Only
        backgroundColor: '#ffffff', // White background
        borderColor: '#3b82f6',     // Blue dashed border (via CSS)
        textColor: '#374151',
        classNames: ['google-event', 'border-dashed', 'border-2'],
        extendedProps: {
            type: 'google',
            order: 0, // Order 0 (Top)
            calendarId: gEvent.calendar_id || 'unknown',
            calendarName: 'Google Calendar', // Should be injected by caller
            htmlLink: gEvent.htmlLink,
            location: gEvent.location,
            description: gEvent.description,
        }
    };
}
