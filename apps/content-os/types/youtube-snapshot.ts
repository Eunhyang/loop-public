/**
 * YouTube Studio Snapshot Types
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * Types for parsing and storing YouTube Studio "Last 7 days" data snapshots
 */

/**
 * Single video row from YouTube Studio snapshot
 */
export interface YouTubeSnapshotRow {
  title: string;
  videoUrl?: string; // Optional stable identifier
  views: number;
  impressions: number | null; // May be absent in some snapshots
  ctr: number | null; // Stored as decimal (0.045 not 4.5%)
}

/**
 * Complete snapshot from YouTube Studio
 */
export interface YouTubeSnapshot {
  snapshotDate: string; // ISO date YYYY-MM-DD, user timezone
  captureTimestamp: number; // Unix timestamp for ordering
  data: YouTubeSnapshotRow[];
  source: 'manual-paste';
}

/**
 * 24h delta calculated from two snapshots
 */
export interface SnapshotDelta {
  title: string;
  views24h: number | null; // null if video not in previous snapshot
  impressions24h: number | null;
  ctr: number | null; // Current snapshot CTR (not delta)
  addedToday: boolean; // True if video not in previous snapshot
}

/**
 * Parser result with validation errors
 */
export interface SnapshotParseResult {
  success: boolean;
  snapshot?: YouTubeSnapshot;
  errors?: string[];
  warnings?: string[];
}

/**
 * Storage statistics
 */
export interface SnapshotStorageStats {
  totalSnapshots: number;
  oldestDate: string | null;
  latestDate: string | null;
  storageUsageBytes: number;
}
