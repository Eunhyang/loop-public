/**
 * DatePicker Wrapper Component
 *
 * Wraps react-tailwindcss-datepicker with ISO string conversion
 * - Input: ISO date string (YYYY-MM-DD) or null
 * - Output: ISO date string (YYYY-MM-DD) or null
 * - Handles timezone-safe conversion (local date only, no UTC shift)
 * - readOnly=true by default to prevent multiple API calls from partial typing
 */

import Datepicker from 'react-tailwindcss-datepicker';
import type { DateValueType } from 'react-tailwindcss-datepicker';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
}

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  compact = false,
  id,
}: DatePickerProps) => {
  // Convert ISO string to Date (avoid UTC shift by using local date)
  const dateValue: Date | null = value ? new Date(value + 'T00:00:00') : null;

  // Library format: {startDate, endDate}
  const libValue: DateValueType = dateValue
    ? { startDate: dateValue, endDate: dateValue }
    : null;

  // Convert library onChange to ISO string
  const handleChange = (newValue: DateValueType) => {
    if (!newValue?.startDate) {
      onChange(null);
      return;
    }

    // Convert Date to YYYY-MM-DD string (local timezone)
    const date = new Date(newValue.startDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoString = `${year}-${month}-${day}`;

    onChange(isoString);
  };

  // Convert minDate/maxDate to Date objects
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : undefined;
  const maxDateObj = maxDate ? new Date(maxDate + 'T00:00:00') : undefined;

  return (
    <Datepicker
      inputId={id}
      value={libValue}
      onChange={handleChange}
      asSingle={true}
      useRange={false}
      displayFormat="YYYY-MM-DD"
      placeholder={placeholder}
      minDate={minDateObj}
      maxDate={maxDateObj}
      disabled={disabled}
      containerClassName={compact ? 'relative' : undefined}
      inputClassName={
        compact
          ? 'input-filter w-full cursor-pointer'
          : 'w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer'
      }
      toggleClassName="absolute right-2 top-1/2 -translate-y-1/2"
    />
  );
};
