import React from 'react';
import { useGoogleCalendars } from '../queries/useGoogleCalendars';
import { useCalendarUi } from '../hooks/useCalendarUi';

export const CalendarSidebar: React.FC = () => {
    const { data: accounts, isLoading, error } = useGoogleCalendars();

    const {
        enabledCalendarIds,
        collapsedAccounts,
        toggleCalendar,
        toggleAccountCollapse
    } = useCalendarUi();

    if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading calendars...</div>;
    if (error) return <div className="p-4 text-sm text-red-500">Failed to load calendars</div>;

    return (
        <div className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📅</span> Google Calendar
                </h2>
                <a
                    href="/api/google/authorize?redirect_after=/"
                    className="flex items-center gap-2 w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 transition-colors"
                >
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">+</div>
                    <span>Add Account</span>
                </a>
            </div>

            <div className="p-2 space-y-2">
                {accounts?.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">No accounts connected</div>
                )}

                {accounts?.map(account => {
                    const isCollapsed = collapsedAccounts.includes(account.email);
                    const chevronClass = isCollapsed ? '-rotate-90' : 'rotate-0';

                    return (
                        <div key={account.accountId} className="rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md group">
                                <button
                                    onClick={() => toggleAccountCollapse(account.email)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <span className={`block text-gray-400 text-xs transition-transform duration-200 ${chevronClass}`}>▼</span>
                                </button>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-xs font-bold">
                                    {account.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-700 truncate" title={account.email}>{account.email}</div>
                                </div>
                                {/* Menu button placeholder - implementing full menu is Phase 3 interaction */}
                                <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500">
                                    ×
                                </button>
                            </div>

                            {!isCollapsed && (
                                <ul className="pl-6 pr-2 pb-2 space-y-1 mt-1">
                                    {account.calendars.map(cal => {
                                        const key = `${account.accountId}__${cal.id}`;
                                        const isChecked = enabledCalendarIds.includes(key);

                                        return (
                                            <li key={cal.id}>
                                                <label className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        style={{ accentColor: cal.color }}
                                                        checked={isChecked}
                                                        onChange={() => toggleCalendar(key)}
                                                    />
                                                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cal.color || '#ccc' }}></span>
                                                    <span className="text-sm text-gray-600 truncate flex-1">{cal.summary}</span>
                                                    {cal.primary && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Main</span>
                                                    )}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
