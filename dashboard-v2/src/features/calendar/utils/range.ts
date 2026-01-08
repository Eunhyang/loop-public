/**
 * Calendar Range Utils
 * Strict YYYY-MM-DD normalization
 */

/**
 * Validates strictly if string is YYYY-MM-DD
 */
export function isValidDateString(dateStr: string | undefined | null): boolean {
    if (!dateStr || typeof dateStr !== 'string') return false;

    // Regex: YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    // Semantic check
    const [y, m, d] = dateStr.split('-').map(Number);
    if (m < 1 || m > 12) return false;

    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * Normalizes any date input (ISO, Date obj) to YYYY-MM-DD string
 * Uses local time (Asia/Seoul implicitly by environment)
 */
export function toDateString(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Adjusts end date for FullCalendar (Exclusive)
 * If end is same as start (single day), add 1 day
 */
export function adjustEndDateExclusive(startStr: string, endStr?: string): string {
    if (!endStr) {
        return addDays(startStr, 1);
    }

    // If start >= end, force end = start + 1 (prevent 1-day invisible events)
    if (startStr >= endStr) {
        return addDays(startStr, 1);
    }

    return endStr;
}

/**
 * Add N days to YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return toDateString(date);
}
