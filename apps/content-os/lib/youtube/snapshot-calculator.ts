/**
 * YouTube Studio Snapshot Calculator
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * Calculate 24h deltas from snapshots
 */

import { YouTubeSnapshot, SnapshotDelta } from '@/types/youtube-snapshot';

/**
 * Calculate 24h deltas by comparing two snapshots
 *
 * @param today - Today's snapshot
 * @param yesterday - Yesterday's snapshot
 * @returns Array of deltas per video
 */
export function calculateDeltas(
  today: YouTubeSnapshot,
  yesterday: YouTubeSnapshot
): SnapshotDelta[] {
  const deltas: SnapshotDelta[] = [];

  // Build map of yesterday's data for quick lookup
  const yesterdayMap = new Map(
    yesterday.data.map((row) => [normalizeTitle(row.title), row])
  );

  for (const todayRow of today.data) {
    const normalizedTitle = normalizeTitle(todayRow.title);
    const yesterdayRow = yesterdayMap.get(normalizedTitle);

    if (!yesterdayRow) {
      // Video added today (not in yesterday's snapshot)
      deltas.push({
        title: todayRow.title,
        views24h: null, // No previous data
        impressions24h: null,
        ctr: todayRow.ctr, // Use current CTR
        addedToday: true,
      });
      continue;
    }

    // Calculate deltas
    const views24h = todayRow.views - yesterdayRow.views;
    const impressions24h =
      todayRow.impressions !== null && yesterdayRow.impressions !== null
        ? todayRow.impressions - yesterdayRow.impressions
        : null;

    deltas.push({
      title: todayRow.title,
      views24h: Math.max(0, views24h), // Clamp to 0 (views should not decrease)
      impressions24h: impressions24h !== null ? Math.max(0, impressions24h) : null,
      ctr: todayRow.ctr, // Use current CTR (not delta)
      addedToday: false,
    });
  }

  return deltas;
}

/**
 * Normalize title for comparison
 * Handles minor differences (whitespace, case)
 */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Match video by title from API data
 * Uses fuzzy matching for better matching rate
 *
 * @param snapshotTitle - Title from snapshot
 * @param apiTitles - Array of titles from API
 * @returns Matched API title or null
 */
export function matchVideoByTitle(
  snapshotTitle: string,
  apiTitles: string[]
): string | null {
  const normalized = normalizeTitle(snapshotTitle);

  // Exact match first
  for (const apiTitle of apiTitles) {
    if (normalizeTitle(apiTitle) === normalized) {
      return apiTitle;
    }
  }

  // Fuzzy match (contains or is contained)
  for (const apiTitle of apiTitles) {
    const apiNormalized = normalizeTitle(apiTitle);

    if (
      apiNormalized.includes(normalized) ||
      normalized.includes(apiNormalized)
    ) {
      return apiTitle;
    }
  }

  return null;
}

/**
 * Get snapshot data by video title
 *
 * @param snapshot - Snapshot to search
 * @param title - Video title
 * @returns Snapshot row or null if not found
 */
export function getSnapshotDataByTitle(
  snapshot: YouTubeSnapshot,
  title: string
): YouTubeSnapshot['data'][0] | null {
  const normalized = normalizeTitle(title);

  for (const row of snapshot.data) {
    if (normalizeTitle(row.title) === normalized) {
      return row;
    }
  }

  return null;
}

/**
 * Calculate date range for snapshot comparison
 *
 * @param date - Target date (YYYY-MM-DD)
 * @returns Previous date (YYYY-MM-DD)
 */
export function getPreviousDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Validate snapshot dates for comparison
 *
 * @param today - Today's snapshot date
 * @param yesterday - Yesterday's snapshot date
 * @returns Validation result
 */
export function validateSnapshotDates(
  today: string,
  yesterday: string
): { valid: boolean; error?: string } {
  const todayDate = new Date(today);
  const yesterdayDate = new Date(yesterday);

  if (isNaN(todayDate.getTime()) || isNaN(yesterdayDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const diffDays = Math.floor(
    (todayDate.getTime() - yesterdayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays !== 1) {
    return {
      valid: false,
      error: `Snapshots are ${diffDays} days apart. Expected 1 day difference for 24h delta.`,
    };
  }

  return { valid: true };
}
