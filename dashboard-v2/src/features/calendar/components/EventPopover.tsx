import React, { useEffect, useRef } from 'react';
import type { GoogleCalendarEvent } from '../types/calendar';

interface EventPopoverProps {
    event: GoogleCalendarEvent;
    anchorEl: HTMLElement; // The DOM element clicked (event element)
    onClose: () => void;
}

export const EventPopover: React.FC<EventPopoverProps> = ({
    event,
    anchorEl,
    onClose
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Close on scroll too? Maybe not.
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // Calculate position relative to anchor
    // Simple logic: Center below or above anchor
    // For robustness, could use Popper.js, but minimal valid CSS for now.
    const rect = anchorEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 5;
    const left = Math.max(10, rect.left + window.scrollX - 100); // Center-ish

    return (
        <div
            ref={popoverRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 p-4 text-sm"
            style={{ top, left }}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-base leading-tight">{event.title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                    <span>🕒</span>
                    <span>
                        {event.allDay ? 'All Day' : (
                            // Format ISO string to time
                            event.start.includes('T')
                                ? new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                                : event.start
                        )}
                        {event.end && !event.allDay && (
                            ` - ${new Date(event.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                        )}
                    </span>
                </div>

                {event.extendedProps.location && (
                    <div className="flex items-start gap-2">
                        <span>📍</span>
                        <span>{event.extendedProps.location}</span>
                    </div>
                )}

                {event.extendedProps.description && (
                    <div className="bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap mt-2">
                        {event.extendedProps.description}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                {event.extendedProps.htmlLink && (
                    <a
                        href={event.extendedProps.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                        Open in Google Calendar ↗
                    </a>
                )}
            </div>
        </div>
    );
};
