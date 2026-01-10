/**
 * Performance Domain Layer
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 */

// Types
export type {
  MetricSource,
  DisplayMetrics,
  MatchType,
  SnapshotMatchResult,
  MergedPerformance,
  MatchStats,
  MergeResult,
  MergeInput,
} from './types';

// Pure functions
export {
  normalizeTitle,
  calculateMatchConfidence,
  findBestSnapshotMatch,
  convertSnapshotCtrToPercentage,
  mergeMetrics,
  calculateMatchStats,
  buildSnapshotLookup,
  buildDeltaLookup,
} from './merge-logic';
