/**
 * Date Filters Component
 *
 * Provides two types of date filtering:
 * 1. Quick Date: Week/Month multi-select buttons (URL-based)
 * 2. Custom Range: Start/End date pickers (localStorage-based)
 *
 * Conflict Resolution:
 * - Selecting week/month clears custom range
 * - Setting custom range clears week/month selections
 */

import { useMemo, useState } from 'react';
import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { getWeekOptions, getMonthOptions } from '@/utils/dateUtils';

export const DateFilters = () => {
  const filters = useCombinedFilters();

  // Mode state: Use local state (not derived) to allow toggling even when both arrays are empty
  // Initialize based on URL state
  const [mode, setMode] = useState<'week' | 'month'>(() => {
    if (filters.selectedMonths.length > 0) return 'month';
    return 'week'; // default
  });

  // Handle mode toggle
  const handleModeToggle = (newMode: 'week' | 'month') => {
    setMode(newMode);
    // Do NOT clear the other array - preserve user selections across mode switches
  };

  // Toggle week selection
  const toggleWeek = (key: string) => {
    const isSelected = filters.selectedWeeks.includes(key);
    const next = isSelected
      ? filters.selectedWeeks.filter((k) => k !== key)
      : [...filters.selectedWeeks, key];
    filters.setSelectedWeeks(next);

    // Clear conflicting filters
    if (filters.dateFilter) {
      filters.setDateFilter('');
    }
    if (filters.dueDateStart || filters.dueDateEnd) {
      filters.setFilter('dueDateStart', null);
      filters.setFilter('dueDateEnd', null);
    }
  };

  // Toggle month selection
  const toggleMonth = (key: string) => {
    const isSelected = filters.selectedMonths.includes(key);
    const next = isSelected
      ? filters.selectedMonths.filter((k) => k !== key)
      : [...filters.selectedMonths, key];
    filters.setSelectedMonths(next);

    // Clear conflicting filters
    if (filters.dateFilter) {
      filters.setDateFilter('');
    }
    if (filters.dueDateStart || filters.dueDateEnd) {
      filters.setFilter('dueDateStart', null);
      filters.setFilter('dueDateEnd', null);
    }
  };

  // Custom date range (localStorage-based)
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newValue = value || null;

    // Validation: Check if range is valid
    if (type === 'start' && filters.dueDateEnd && newValue && newValue > filters.dueDateEnd) {
      // Auto-adjust: set end = start to maintain valid range
      filters.setFilter('dueDateEnd', newValue);
    }

    if (type === 'end' && filters.dueDateStart && newValue && newValue < filters.dueDateStart) {
      // Show warning but allow (selector will skip invalid range)
      console.warn('End date is before start date');
    }

    // Set the date
    filters.setFilter(type === 'start' ? 'dueDateStart' : 'dueDateEnd', newValue);

    // Clear conflicting filters when custom range is set
    if (newValue) {
      if (filters.dateFilter) {
        filters.setDateFilter('');
      }
      if (filters.selectedWeeks.length > 0) {
        filters.setSelectedWeeks([]);
      }
      if (filters.selectedMonths.length > 0) {
        filters.setSelectedMonths([]);
      }
    }
  };

  // Generate week/month options
  const weekOptions = useMemo(() => getWeekOptions(5), []);
  const monthOptions = useMemo(() => getMonthOptions(5), []);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Date Filters
      </h3>

      {/* Quick Date Multi-Select */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500">Quick Date</span>

        {/* Mode Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => handleModeToggle('week')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'week'
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
            }`}
          >
            W
          </button>
          <button
            onClick={() => handleModeToggle('month')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'month'
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
            }`}
          >
            M
          </button>
        </div>

        {/* Week/Month Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {mode === 'week'
            ? weekOptions.map(({ key, label, isCurrent }) => {
                const isSelected = filters.selectedWeeks.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleWeek(key)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                      isSelected && isCurrent
                        ? 'bg-primary text-white ring-2 ring-white/30'
                        : isSelected
                          ? 'bg-primary/80 text-white border border-primary'
                          : isCurrent
                            ? 'bg-zinc-800 text-gray-400 ring-2 ring-primary/50 hover:bg-zinc-700'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })
            : monthOptions.map(({ key, label, isCurrent }) => {
                const isSelected = filters.selectedMonths.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleMonth(key)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                      isSelected && isCurrent
                        ? 'bg-primary text-white ring-2 ring-white/30'
                        : isSelected
                          ? 'bg-primary/80 text-white border border-primary'
                          : isCurrent
                            ? 'bg-zinc-800 text-gray-400 ring-2 ring-primary/50 hover:bg-zinc-700'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500">Custom Range</span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date-start" className="text-xs text-gray-400">
              Start Date
            </label>
            <input
              id="date-start"
              type="date"
              value={filters.dueDateStart || ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-2 py-1.5 rounded bg-zinc-800 text-sm text-gray-200 border border-zinc-700 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-end" className="text-xs text-gray-400">
              End Date
            </label>
            <input
              id="date-end"
              type="date"
              value={filters.dueDateEnd || ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-2 py-1.5 rounded bg-zinc-800 text-sm text-gray-200 border border-zinc-700 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(filters.dateFilter ||
        filters.dueDateStart ||
        filters.dueDateEnd ||
        filters.selectedWeeks.length > 0 ||
        filters.selectedMonths.length > 0) && (
        <button
          onClick={() => {
            filters.setDateFilter('');
            filters.setFilter('dueDateStart', null);
            filters.setFilter('dueDateEnd', null);
            filters.setSelectedWeeks([]);
            filters.setSelectedMonths([]);
          }}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors text-left"
        >
          Clear Date Filters
        </button>
      )}
    </div>
  );
};
