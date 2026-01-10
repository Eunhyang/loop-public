/**
 * Performance Merge Logic
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Pure functions for merging API and snapshot data.
 * No side effects, no dependencies on external services.
 */

import type { ContentMetrics } from '@/types/performance';
import type { SnapshotDelta, YouTubeSnapshotRow } from '@/types/youtube-snapshot';
import type {
  DisplayMetrics,
  SnapshotMatchResult,
  MatchStats,
  MatchType,
} from './types';

/**
 * Normalize title for comparison
 * Handles whitespace, case, and common variations
 */
export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove common suffixes that may differ
    .replace(/\s*[-|]\s*(shorts?|official|hd|4k)$/i, '')
    .trim();
}

/**
 * Calculate match confidence between two titles
 * Returns 0-1, where 1 is exact match
 */
export function calculateMatchConfidence(
  title1: string,
  title2: string
): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  if (norm1 === norm2) {
    return 1.0; // Exact match
  }

  // Check containment
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    return shorter.length / longer.length; // Partial match confidence
  }

  return 0;
}

/**
 * Find best matching snapshot title for an API video
 */
export function findBestSnapshotMatch(
  apiTitle: string,
  snapshotTitles: string[]
): SnapshotMatchResult {
  const normalized = normalizeTitle(apiTitle);
  let bestMatch: SnapshotMatchResult = {
    matchType: 'none',
    snapshotTitle: '',
    confidence: 0,
  };

  for (const snapshotTitle of snapshotTitles) {
    const snapshotNormalized = normalizeTitle(snapshotTitle);

    // Exact match
    if (snapshotNormalized === normalized) {
      return {
        matchType: 'exact',
        snapshotTitle,
        confidence: 1.0,
      };
    }

    // Fuzzy match (contains)
    const confidence = calculateMatchConfidence(apiTitle, snapshotTitle);
    if (confidence > bestMatch.confidence && confidence >= 0.7) {
      bestMatch = {
        matchType: 'fuzzy',
        snapshotTitle,
        confidence,
      };
    }
  }

  return bestMatch;
}

/**
 * Convert snapshot CTR (decimal 0.045) to percentage (4.5)
 */
export function convertSnapshotCtrToPercentage(ctr: number | null): number {
  if (ctr === null) return 0;
  // Snapshot stores as decimal (0.045 = 4.5%)
  // If value is > 1, assume it's already a percentage
  return ctr > 1 ? ctr : ctr * 100;
}

/**
 * Merge API metrics with snapshot data
 */
export function mergeMetrics(
  apiMetrics: ContentMetrics,
  snapshotRow: YouTubeSnapshotRow | null,
  snapshotDelta: SnapshotDelta | null
): DisplayMetrics {
  // Start with API metrics as base
  const displayMetrics: DisplayMetrics = {
    ...apiMetrics,
    impressionsSource: 'api',
    ctrSource: 'api',
  };

  // If we have snapshot data, prefer it for impressions and CTR
  // (YouTube API doesn't provide thumbnail impressions)
  if (snapshotRow) {
    // Use snapshot impressions if available and API has 0
    if (snapshotRow.impressions !== null && apiMetrics.impressions_24h === 0) {
      displayMetrics.impressions_24h = snapshotRow.impressions;
      displayMetrics.impressionsSource = 'snapshot';
    }

    // Use snapshot CTR if available and API has 0
    if (snapshotRow.ctr !== null && apiMetrics.ctr_24h === 0) {
      displayMetrics.ctr_24h = convertSnapshotCtrToPercentage(snapshotRow.ctr);
      displayMetrics.ctrSource = 'snapshot';
    }
  }

  // Add delta values if available
  if (snapshotDelta) {
    displayMetrics.views_delta = snapshotDelta.views24h ?? undefined;
    displayMetrics.impressions_delta = snapshotDelta.impressions24h ?? undefined;

    // Calculate CTR delta if we have previous data
    // Note: snapshotDelta.ctr is current CTR, not delta
    // We could calculate delta if we had previous CTR stored
  }

  return displayMetrics;
}

/**
 * Calculate match statistics from merge results
 */
export function calculateMatchStats(
  matches: Array<{ matchType: MatchType }>
): MatchStats {
  const stats: MatchStats = {
    total: matches.length,
    exactMatches: 0,
    fuzzyMatches: 0,
    noMatches: 0,
  };

  for (const match of matches) {
    switch (match.matchType) {
      case 'exact':
        stats.exactMatches++;
        break;
      case 'fuzzy':
        stats.fuzzyMatches++;
        break;
      case 'none':
        stats.noMatches++;
        break;
    }
  }

  return stats;
}

/**
 * Build lookup map from snapshot data by normalized title
 */
export function buildSnapshotLookup(
  data: YouTubeSnapshotRow[]
): Map<string, YouTubeSnapshotRow> {
  const map = new Map<string, YouTubeSnapshotRow>();
  for (const row of data) {
    map.set(normalizeTitle(row.title), row);
  }
  return map;
}

/**
 * Build lookup map from deltas by normalized title
 */
export function buildDeltaLookup(
  deltas: SnapshotDelta[]
): Map<string, SnapshotDelta> {
  const map = new Map<string, SnapshotDelta>();
  for (const delta of deltas) {
    map.set(normalizeTitle(delta.title), delta);
  }
  return map;
}
