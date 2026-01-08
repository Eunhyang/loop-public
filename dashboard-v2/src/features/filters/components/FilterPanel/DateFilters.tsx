/**
 * Date Filters Component
 *
 * Provides two types of date filtering:
 * 1. Quick Date: Week/Month buttons (URL-based)
 * 2. Custom Range: Start/End date pickers (localStorage-based)
 *
 * Conflict Resolution:
 * - Selecting Quick Date clears custom range
 * - Setting custom range clears Quick Date
 */

import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import type { DateFilter } from '@/types/filters';

export const DateFilters = () => {
  const filters = useCombinedFilters();

  // Quick Date buttons (URL-based)
  const handleQuickDateClick = (filter: DateFilter) => {
    // Clear custom date range when Quick Date is selected
    if (filter) {
      filters.setFilter('dueDateStart', null);
      filters.setFilter('dueDateEnd', null);
    }
    filters.setDateFilter(filter === filters.dateFilter ? '' : filter);
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

    // Clear Quick Date when custom range is set
    if (newValue && filters.dateFilter) {
      filters.setDateFilter('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Date Filters
      </h3>

      {/* Quick Date Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500">Quick Date</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickDateClick('W')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filters.dateFilter === 'W'
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleQuickDateClick('M')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filters.dateFilter === 'M'
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
            }`}
          >
            This Month
          </button>
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
      {(filters.dateFilter || filters.dueDateStart || filters.dueDateEnd) && (
        <button
          onClick={() => {
            filters.setDateFilter('');
            filters.setFilter('dueDateStart', null);
            filters.setFilter('dueDateEnd', null);
          }}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors text-left"
        >
          Clear Date Filters
        </button>
      )}
    </div>
  );
};
