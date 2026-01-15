/**
 * Date filtering utilities for Kanban board
 * Provides stable, calendar-anchored date ranges
 */

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get current calendar week range (Sunday to Saturday)
 */
export const getWeekRange = (): DateRange => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get current calendar month range
 */
export const getMonthRange = (): DateRange => {
  const today = new Date();

  // Start of month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  // End of month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

/**
 * Check if a date string is within the given range
 * Handles null/undefined dates gracefully
 * Normalizes dates to local midnight for consistent timezone handling
 */
export const isWithinRange = (
  dueDate: string | null | undefined,
  range: DateRange
): boolean => {
  if (!dueDate) return false;

  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return false;

  const due = new Date(year, month - 1, day);

  // Check for invalid date
  if (isNaN(due.getTime())) return false;

  return due >= range.start && due <= range.end;
};

/**
 * Format date for display (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get week range by ISO week key (e.g., "2026-W01")
 * Returns null if invalid key format
 */
export const getWeekRangeByKey = (weekKey: string): DateRange | null => {
  // Parse "YYYY-Www" format
  const match = weekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // ISO week 1 is the week containing the first Thursday of the year
  // Calculate the start of week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Convert Sunday=0 to 7
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1); // Monday of week 1

  // Calculate start of the requested week
  const startOfWeek = new Date(startOfWeek1);
  startOfWeek.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get month range by key (e.g., "2026-01")
 * Returns null if invalid key format
 */
export const getMonthRangeByKey = (monthKey: string): DateRange | null => {
  // Parse "YYYY-MM" format
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed

  const startOfMonth = new Date(year, month, 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(year, month + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

/**
 * Check if a date string is within a start/end range
 * Alternative signature for convenience
 */
export const isDateInRange = (
  dateStr: string | null | undefined,
  start: Date,
  end: Date
): boolean => {
  if (!dateStr) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return false;

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return false;

  return date >= start && date <= end;
};
