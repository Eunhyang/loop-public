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
    <div className="flex flex-col gap-4">
      <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em] mb-1">
        Date Filters
      </h3>

      {/* Quick Date Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 ml-0.5">Quick Date</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickDateClick('W')}
            className={`flex-1 px-3 py-1.5 rounded text-[12px] font-medium border transition-all duration-150 ${filters.dateFilter === 'W'
                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
              }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleQuickDateClick('M')}
            className={`flex-1 px-3 py-1.5 rounded text-[12px] font-medium border transition-all duration-150 ${filters.dateFilter === 'M'
                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
              }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold text-zinc-500 ml-0.5">Custom Range</span>
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date-start" className="text-[10px] text-zinc-400 font-medium ml-0.5">
              START DATE
            </label>
            <input
              id="date-start"
              type="date"
              value={filters.dueDateStart || ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-2.5 py-1.5 rounded bg-white text-[12px] text-zinc-800 border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date-end" className="text-[10px] text-zinc-400 font-medium ml-0.5">
              END DATE
            </label>
            <input
              id="date-end"
              type="date"
              value={filters.dueDateEnd || ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-2.5 py-1.5 rounded bg-white text-[12px] text-zinc-800 border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
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
          className="mt-1 text-[11px] text-zinc-400 hover:text-red-500 transition-colors text-left flex items-center gap-1.5 underline-offset-2 hover:underline inline-fit w-fit"
        >
          <span>✕</span> Clear Date Filters
        </button>
      )}
    </div>
  );
};
