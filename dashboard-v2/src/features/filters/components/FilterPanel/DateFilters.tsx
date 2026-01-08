import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { DatePicker } from '@/components/common/DatePicker';

export const DateFilters = () => {
  const filters = useCombinedFilters();

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

    // Clear conflicting URL filters when custom range is set
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

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        Date Filters
      </h3>

      {/* Custom Date Range */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500">Custom Range</span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date-start" className="text-xs text-zinc-500">
              Start Date
            </label>
            <DatePicker
              id="date-start"
              value={filters.dueDateStart || null}
              onChange={(value) => handleDateChange('start', value || '')}
              compact={true}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-end" className="text-xs text-zinc-500">
              End Date
            </label>
            <DatePicker
              id="date-end"
              value={filters.dueDateEnd || null}
              onChange={(value) => handleDateChange('end', value || '')}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(filters.dueDateStart || filters.dueDateEnd) && (
        <button
          onClick={() => {
            filters.setFilter('dueDateStart', null);
            filters.setFilter('dueDateEnd', null);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors text-left underline"
        >
          Clear Date Filters
        </button>
      )}
    </div>
  );
};
