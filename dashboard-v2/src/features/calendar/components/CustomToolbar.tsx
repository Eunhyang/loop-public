import React from 'react';
import { useCalendarUi } from '../hooks/useCalendarUi';

interface CustomToolbarProps {
    title: string; // Current View Title (e.g. "January 2024")
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    currentView: string;
    onViewChange: (view: string) => void;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = ({
    title,
    onPrev,
    onNext,
    onToday,
    currentView,
    onViewChange,
}) => {
    const { expandMode, toggleExpandMode } = useCalendarUi();

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800 mr-4">{title}</h1>
                <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button onClick={onPrev} className="px-2 py-1 text-gray-600 hover:bg-white rounded shadow-sm transition-all">
                        ←
                    </button>
                    <button onClick={onToday} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded mx-0.5 transition-all">
                        Today
                    </button>
                    <button onClick={onNext} className="px-2 py-1 text-gray-600 hover:bg-white rounded shadow-sm transition-all">
                        →
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Expand Toggle (Only active in Month view ideally, but useful globally) */}
                {currentView === 'dayGridMonth' && (
                    <button
                        onClick={toggleExpandMode}
                        className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${expandMode
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {expandMode ? 'Collapse' : '+ More'}
                    </button>
                )}

                {/* View Switcher */}
                <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button
                        onClick={() => onViewChange('dayGridMonth')}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${currentView === 'dayGridMonth' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => onViewChange('timeGridWeek')}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${currentView === 'timeGridWeek' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Week
                    </button>
                </div>
            </div>
        </div>
    );
};
