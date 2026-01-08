/**
 * Date Utilities for ISO Week and Month Calculations
 *
 * Features:
 * - ISO 8601 Week calculation (Monday-based weeks, local timezone)
 * - Week/Month label formatting for UI display
 * - Option generation for multi-select filters
 *
 * DST Safety:
 * - All date calculations normalize to noon (12:00) local time
 * - Avoids DST transition edge cases (2am/3am jumps)
 */

export interface DateOption {
  key: string; // ISO Week: '2026-W02', Month: '2026-01'
  label: string; // ISO Week: 'M1W2', Month: 'Jan 2026'
  isCurrent: boolean; // true if current week/month
}

/**
 * Get Monday date for a given ISO Week
 * @param isoWeek - ISO Week string (e.g., '2026-W02')
 * @returns Monday date of that week (noon normalized)
 */
function getISOWeekMonday(isoWeek: string): Date {
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // ISO 8601: Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4, 12, 0, 0); // noon to avoid DST
  const jan4Day = jan4.getDay() || 7; // 1=Mon, 7=Sun

  // Find Monday of week 1
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));

  // Add weeks to get target Monday
  const targetMonday = new Date(mondayWeek1);
  targetMonday.setDate(mondayWeek1.getDate() + (week - 1) * 7);

  return targetMonday;
}

/**
 * Get ISO Week string for a given date
 * @param date - Input date
 * @returns ISO Week string (e.g., '2026-W02')
 */
export function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); // noon to avoid DST edge cases

  const jan4 = new Date(d.getFullYear(), 0, 4, 12, 0, 0);
  const jan4Day = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1));

  const daysSinceMonday = Math.floor(
    (d.getTime() - mondayWeek1.getTime()) / 86400000
  );
  const week = Math.floor(daysSinceMonday / 7) + 1;

  let year = d.getFullYear();

  // Edge case: Dec 29-31 might be week 1 of next year
  if (d.getMonth() === 11 && week === 1) {
    year++;
  }
  // Edge case: Jan 1-3 might be last week of prev year
  if (d.getMonth() === 0 && week > 50) {
    year--;
  }

  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Convert ISO Week to display label
 * @param isoWeek - ISO Week string (e.g., '2026-W02')
 * @returns Display label (e.g., 'M1W2')
 *
 * Month index is based on the Monday (start date) of the ISO Week
 */
export function formatWeekLabel(isoWeek: string): string {
  const monday = getISOWeekMonday(isoWeek);
  const month = monday.getMonth() + 1; // 1-12
  const [, weekStr] = isoWeek.split('-W');
  const week = parseInt(weekStr, 10);
  return `M${month}W${week}`;
}

/**
 * Generate week options for multi-select filter
 * @param count - Number of weeks to generate (must be odd, >= 1)
 * @returns Array of week options (ascending time order)
 */
export function getWeekOptions(count: number): DateOption[] {
  if (count < 1 || count % 2 === 0) {
    throw new Error('count must be odd and >= 1');
  }

  const offset = Math.floor((count - 1) / 2);
  const now = new Date();
  now.setHours(12, 0, 0, 0); // noon to avoid DST
  const currentWeek = getISOWeek(now);

  const options: DateOption[] = [];

  for (let i = -offset; i <= offset; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i * 7);
    const key = getISOWeek(date);
    const label = formatWeekLabel(key);
    const isCurrent = key === currentWeek;
    options.push({ key, label, isCurrent });
  }

  return options;
}

/**
 * Convert month key to display label
 * @param key - Month key (e.g., '2026-01')
 * @returns Display label (e.g., 'Jan 2026')
 */
function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Generate month options for multi-select filter
 * @param count - Number of months to generate (must be odd, >= 1)
 * @returns Array of month options (ascending time order)
 */
export function getMonthOptions(count: number): DateOption[] {
  if (count < 1 || count % 2 === 0) {
    throw new Error('count must be odd and >= 1');
  }

  const offset = Math.floor((count - 1) / 2);
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const options: DateOption[] = [];

  for (let i = -offset; i <= offset; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = formatMonthLabel(key);
    const isCurrent = key === currentKey;
    options.push({ key, label, isCurrent });
  }

  return options;
}
