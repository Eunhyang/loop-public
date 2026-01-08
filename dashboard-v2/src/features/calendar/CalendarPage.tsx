import React, { useState, useCallback } from 'react';
import { CalendarView } from './components/CalendarView';
import { CalendarSidebar } from './components/CalendarSidebar';
import { CustomToolbar } from './components/CustomToolbar';
import { ContextMenu } from './components/ContextMenu';
import { EventPopover } from './components/EventPopover';
import { TaskFilterBar } from '@/features/filters/components/TaskFilterBar';
import { FilterPanel } from '@/features/filters/components/FilterPanel';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { useCalendarEvents } from './queries/useCalendarEvents';
import { useCalendarUi } from './hooks/useCalendarUi';
import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import type { CalendarRange, GoogleCalendarEvent } from './types/calendar';

export default function CalendarPage() {
    const [range, setRange] = useState<CalendarRange | null>(null);
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [currentTitle, setCurrentTitle] = useState('');

    // UI State for interactions
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; dateStr: string } | null>(null);
    const [popover, setPopover] = useState<{ event: GoogleCalendarEvent; anchorEl: HTMLElement } | null>(null);

    const { enabledCalendarIds, expandMode } = useCalendarUi();
    const { openEntityDrawer } = useUi();
    const combinedFilters = useCombinedFilters();
    const panelFilters = useFilterContext();
    const { data: dashboardData } = useDashboardInit();

    const { events, isGoogleFetching } = useCalendarEvents({
        range,
        enabledCalendarKeys: enabledCalendarIds,
        expandMode,
        filters: combinedFilters
    });

    // Since CustomToolbar is outside FullCalendar, we need a ref to API
    // But CalendarView encapsulates FullCalendar.
    // We can lift the "ref" or use a shared context. 
    // Simpler: Pass "action" props to CalendarView? 
    // FullCalendar API access is tricky through encapsulation.
    // Solution: Forward Ref / or Lift State completely.
    // Let's modify CalendarView to accept a ref or expose an API.
    // Actually, standard pattern:
    const calendarRef = React.useRef<any>(null); // FullCalendar instance is buried. 
    // Let's adjust CalendarView to expose the API.

    const handleRangeChange = useCallback((newRange: { start: string; end: string }) => {
        // Range comes from FullCalendar 'datesSet'.
        // We also update title here if possible, but title is 'text' in datesSet.
        setRange(newRange);
    }, []);

    const handleDatesSet = (arg: any) => {
        setCurrentTitle(arg.view.title);
        handleRangeChange({
            start: new Date(arg.start).toISOString().split('T')[0], // Safety
            end: new Date(arg.end).toISOString().split('T')[0]
        });
        setCurrentView(arg.view.type);
    }

    // Toolbar Actions via Ref
    const handlePrev = () => calendarRef.current?.getApi().prev();
    const handleNext = () => calendarRef.current?.getApi().next();
    const handleToday = () => calendarRef.current?.getApi().today();
    const handleViewChange = (view: string) => calendarRef.current?.getApi().changeView(view);

    // Interaction Handlers
    const handleDateClick = (_info: any) => {
        // Clear menus on normal click
        setContextMenu(null);
        setPopover(null);
    };

    const handleDateContextMenu = (info: any) => {
        setContextMenu({
            x: info.jsEvent.clientX,
            y: info.jsEvent.clientY,
            dateStr: info.dateStr
        });
    };

    const handleEventClick = (info: any) => {
        const { type } = info.event.extendedProps;
        if (type === 'google') {
            setPopover({
                event: {
                    ...info.event.toPlainObject(),
                    extendedProps: info.event.extendedProps
                } as GoogleCalendarEvent,
                anchorEl: info.el
            });
        } else if (type === 'task' && info.event.extendedProps.taskId) {
            // Clear any open popover/context menu before opening drawer
            setPopover(null);
            setContextMenu(null);
            openEntityDrawer({ type: 'task', mode: 'edit', id: info.event.extendedProps.taskId });
        }
    };

    const handleAddMeeting = (dateStr: string) => {
        setContextMenu(null);
        console.log('Create Meeting Task at', dateStr);
        // TaskDrawer.create({ date: dateStr, type: 'meeting' });
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden">
            <CalendarSidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Task Filter Bar */}
                {dashboardData && (
                    <TaskFilterBar
                        filters={combinedFilters}
                        members={dashboardData.members}
                        projects={dashboardData.projects}
                        programs={dashboardData.programs || []}
                        tasks={dashboardData.tasks}
                    />
                )}

                <CustomToolbar
                    title={currentTitle}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onToday={handleToday}
                    currentView={currentView}
                    onViewChange={handleViewChange}
                />

                {/* Pass ref down to access API */}
                <WrapperCalendarView
                    ref={calendarRef}
                    events={events}
                    onDatesSet={handleDatesSet}
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                    onDateContextMenu={handleDateContextMenu}
                />

                {isGoogleFetching && (
                    <div className="absolute top-20 right-4 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs shadow-sm z-50 animate-pulse">
                        Syncing Google...
                    </div>
                )}
            </div>

            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={() => setContextMenu(null)}
                    onAddMeeting={handleAddMeeting}
                />
            )}

            {popover && (
                <EventPopover
                    {...popover}
                    onClose={() => setPopover(null)}
                />
            )}

            {/* Filter Panel */}
            <FilterPanel
                isOpen={panelFilters.isPanelOpen}
                onClose={panelFilters.togglePanel}
            />
        </div>
    );
}

// Wrapper to foward ref to FullCalendar
// Since CalendarView we defined earlier didn't use forwardRef, we update it here or patch it.
// Let's redefine small wrapper or assume CalendarView is updated.
// I will patch CalendarView.tsx to use forwardRef in next step.
// For now, importing "WrapperCalendarView" is placeholder. 
// Actually, I can just use CalendarView if I modify it.
const WrapperCalendarView = React.forwardRef((props: any, ref) => (
    <CalendarView {...props} calendarRef={ref} /> // Passing ref via prop
));
