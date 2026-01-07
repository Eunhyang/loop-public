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
