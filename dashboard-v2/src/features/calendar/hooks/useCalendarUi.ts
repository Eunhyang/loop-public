import { useState } from 'react';

const STORAGE_KEYS = {
    ENABLED_CALENDARS: 'v2_calendar_enabled_ids',
    COLLAPSED_ACCOUNTS: 'v2_calendar_collapsed_accounts',
    EXPAND_MODE: 'v2_calendar_expand_mode'
} as const;

/**
 * useLocalStorage Check
 */
function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue] as const;
}

export function useCalendarUi() {
    // Enabled Calendars (Format: "accountId__calendarId")
    const [enabledCalendarIds, setEnabledCalendarIds] = useLocalStorage<string[]>(
        STORAGE_KEYS.ENABLED_CALENDARS,
        []
    );

    // Collapsed Accounts (emails)
    const [collapsedAccounts, setCollapsedAccounts] = useLocalStorage<string[]>(
        STORAGE_KEYS.COLLAPSED_ACCOUNTS,
        []
    );

    // Expand Mode (Month View)
    // true = Show All, false = +more
    const [expandMode, setExpandMode] = useLocalStorage<boolean>(
        STORAGE_KEYS.EXPAND_MODE,
        false
    );

    const toggleCalendar = (id: string) => {
        setEnabledCalendarIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleAccountCollapse = (email: string) => {
        setCollapsedAccounts(prev =>
            prev.includes(email) ? prev.filter(a => a !== email) : [...prev, email]
        );
    };

    const toggleExpandMode = () => setExpandMode(prev => !prev);

    return {
        enabledCalendarIds,
        collapsedAccounts,
        expandMode,
        toggleCalendar,
        toggleAccountCollapse,
        toggleExpandMode,
        setExpandMode
    };
}
