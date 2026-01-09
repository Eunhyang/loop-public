// Domain logic - Pure functions only, no external dependencies
// Follows Content OS Clean Architecture Constitution

import { VideoSummary, MAX_RESULTS_PER_PAGE } from './types';

/**
 * Merges new page of videos with existing, removing duplicates by videoId
 */
export function mergeVideoPages(
  existing: VideoSummary[],
  newPage: VideoSummary[]
): VideoSummary[] {
  const seen = new Set(existing.map(v => v.videoId));
  const unique = newPage.filter(v => !seen.has(v.videoId));
  return [...existing, ...unique];
}

/**
 * Determines if another page should be fetched
 */
export function shouldFetchNextPage(
  currentCount: number,
  targetLimit: number,
  hasNextToken: boolean
): boolean {
  return currentCount < targetLimit && hasNextToken;
}

/**
 * Calculates optimal page size for next API call
 */
export function calculatePageSize(
  currentCount: number,
  targetLimit: number
): number {
  const remaining = targetLimit - currentCount;
  return Math.min(remaining, MAX_RESULTS_PER_PAGE);
}

/**
 * Validates limit input
 */
export function validateLimit(limit: number, maxLimit: number): number {
  if (isNaN(limit)) {
    throw new Error('Limit must be a valid number');
  }
  if (limit < 0) {
    throw new Error('Limit must be non-negative');
  }
  if (limit === 0) {
    return 0;
  }
  return Math.min(limit, maxLimit);
}
