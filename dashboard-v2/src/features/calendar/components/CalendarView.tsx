import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { BaseCalendarEvent } from '../types/calendar';
import { useCalendarUi } from '../hooks/useCalendarUi';
import { useUpdateTaskDates } from '../queries/useUpdateTaskDates';
import { toDateString } from '../utils/range';

interface CalendarViewProps {
    events: BaseCalendarEvent[];
    calendarRef: React.RefObject<FullCalendar>;
    onDatesSet: (arg: any) => void;
    onEventClick: (info: any) => void;
    onDateClick: (info: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    events,
    calendarRef,
    onDatesSet,
    onEventClick,
    onDateClick
}) => {
    const { expandMode } = useCalendarUi();
    const { mutate: updateTaskDates } = useUpdateTaskDates();

    // FullCalendar Options (Strict Parity)
    const options = useMemo(() => ({
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: 'ko',
        timeZone: 'Asia/Seoul',
        headerToolbar: false as any, // Custom toolbar will control this
        height: '100%',

        // Legacy Sort Logic: Google(0) -> Task(1)
        eventOrder: ['order', 'start', 'duration', 'allDay', 'title'],

        // View Config
        views: {
            timeGridWeek: {
                titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } as any,
                dayMaxEvents: false, // Always show all
            },
            timeGridDay: {
                dayMaxEvents: false,
            },
            dayGridMonth: {
                dayMaxEvents: !expandMode, // Toggle logic: expandMode=true -> false(ShowAll)
            },
        },

        // Interactions
        editable: true,
        eventStartEditable: true,
        eventDurationEditable: true,
        selectable: true,
        selectMirror: true,
        nowIndicator: true,

        // Handlers
        datesSet: (info: any) => {
            onDatesSet(info);
        },

        eventClick: (info: any) => {
            onEventClick(info);
        },

        dateClick: (info: any) => {
            onDateClick(info);
        },

        // Mutation Handlers
        eventDrop: (info: any) => {
            const { event, revert } = info;
            const { type, taskId } = event.extendedProps;

            if (type !== 'task') {
                revert();
                return;
            }

            // Convert to YYYY-MM-DD
            const newStart = toDateString(event.start);
            // If allDay, end is exclusive next day. If timed, end might be null?
            // Legacy Parity: Just send YYYY-MM-DD.
            // If event became allDay, end is next day 00:00
            let newEnd = event.end ? toDateString(event.end) : newStart;

            // Fix: If it was dropped as AllDay, FullCalendar end is +1 day.
            // Task 'due' is inclusive. So we might need to adjust?
            // Wait, range.ts 'adjustEndDateExclusive' handles display.
            // Here we act on data update.
            // API expects 'due'. In legacy, 'due' is inclusive.
            // If FullCalendar says end=2024-01-02 (exclusive), task due should be 2024-01-01.

            // Let's check eventTransformers.ts
            // It transforms task.due -> end (exclusive).
            // So here: end (exclusive) -> task.due (inclusive).
            if (event.allDay && event.end) {
                // Substract 1 day from end string?
                const endDateObj = new Date(event.end);
                endDateObj.setDate(endDateObj.getDate() - 1);
                newEnd = toDateString(endDateObj);
            } else if (!event.end) {
                // Single day event
                newEnd = newStart;
            }

            updateTaskDates({
                taskId,
                start_date: newStart,
                due: newEnd
            }, {
                onError: () => revert() // Rollback on error
            });
        },

        eventResize: (info: any) => {
            const { event, revert } = info;
            const { type, taskId } = event.extendedProps;

            if (type !== 'task') {
                revert();
                return;
            }

            let newEnd = event.end ? toDateString(event.end) : toDateString(event.start);

            // Same exclusive -> inclusive adjustment
            if (event.allDay && event.end) {
                const endDateObj = new Date(event.end);
                endDateObj.setDate(endDateObj.getDate() - 1);
                newEnd = toDateString(endDateObj);
            }

            updateTaskDates({
                taskId,
                // start_date doesn't change on resize usually, but send undefined to keep it?
                // useUpdateTaskDates handles partial updates?
                // Yes, existing implementation sends both, but let's check hook signature.
                // It takes {taskId, start_date, due}.
                // Resize acts on END mostly.
                due: newEnd
            }, {
                onError: () => revert()
            });
        }

    }), [expandMode, onDatesSet, onEventClick, onDateClick, updateTaskDates]);

    return (
        <div className="flex-1 h-full relative calendar-wrapper">
            <FullCalendar
                ref={calendarRef}
                events={events} // Reactivty: events array usage
                {...options}
            />
        </div>
    );
};
