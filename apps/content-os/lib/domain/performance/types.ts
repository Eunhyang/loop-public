/**
 * Performance Domain Types
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Pure domain types for merged performance data.
 * No dependencies on infrastructure or application layers.
 */

import type { ContentPerformance, ContentMetrics } from '@/types/performance';

/**
 * Source of metric data
 */
export type MetricSource = 'api' | 'snapshot' | 'none';

/**
 * Display metrics with source tracking and deltas
 */
export interface DisplayMetrics {
  // Core metrics (same as ContentMetrics)
  impressions_24h: number;
  impressions_7d: number;
  ctr_24h: number; // percentage (0-100)
  ctr_7d: number;
  views_24h: number;
  views_7d: number;
  avg_view_duration_24h: number;
  avg_view_duration_7d: number;

  // Source tracking (where each metric came from)
  impressionsSource: MetricSource;
  ctrSource: MetricSource;

  // 24h deltas from snapshot comparison (optional)
  impressions_delta?: number;
  ctr_delta?: number;
  views_delta?: number;
}

/**
 * Match type for video title matching
 */
export type MatchType = 'exact' | 'fuzzy' | 'none';

/**
 * Result of matching a video to snapshot data
 */
export interface SnapshotMatchResult {
  matchType: MatchType;
  snapshotTitle: string;
  confidence: number; // 0-1, 1 = exact match
}

/**
 * Merged performance data combining API and snapshot sources
 */
export interface MergedPerformance extends ContentPerformance {
  /**
   * Display metrics with source tracking.
   * Use this instead of `metrics` for UI rendering.
   */
  displayMetrics: DisplayMetrics;

  /**
   * Snapshot match result, null if no snapshot data
   */
  snapshotMatch: SnapshotMatchResult | null;
}

/**
 * Statistics about video matching between API and snapshot
 */
export interface MatchStats {
  total: number;
  exactMatches: number;
  fuzzyMatches: number;
  noMatches: number;
}

/**
 * Result of merge operation
 */
export interface MergeResult {
  mergedData: MergedPerformance[];
  snapshotDate: string | null;
  matchStats: MatchStats;
  deltaAvailable: boolean;
}

/**
 * Input for merge operation
 */
export interface MergeInput {
  apiVideos: ContentPerformance[];
  includeDeltas: boolean;
}
