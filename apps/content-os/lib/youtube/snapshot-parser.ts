/**
 * YouTube Studio Snapshot Parser
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * Parses YouTube Studio "Last 7 days" clipboard data
 *
 * YouTube Studio format (multi-line per video):
 * Video thumbnail: [title]
 * [duration] (e.g., "1:58" or "11:23")
 * [title repeated]
 * [views] (e.g., "2,320")
 * [views %]
 * [watch time hours] (e.g., "9.9")
 * [watch time %]
 * [subscribers] (e.g., "0" or "-1")
 * [subscribers %]
 * [revenue] (e.g., "$1.25" or "—")
 * [revenue %]
 * [impressions] (e.g., "1,594")
 * [CTR] (e.g., "6.8%")
 */

import {
  YouTubeSnapshot,
  YouTubeSnapshotRow,
  SnapshotParseResult,
} from '@/types/youtube-snapshot';

/**
 * Maximum paste size (1MB)
 */
const MAX_PASTE_SIZE = 1024 * 1024;

/**
 * Video thumbnail marker
 */
const VIDEO_MARKER = 'Video thumbnail:';

/**
 * Parse YouTube Studio clipboard text (multi-line format)
 *
 * @param text - Raw clipboard text from YouTube Studio
 * @param snapshotDate - Date for this snapshot (ISO format YYYY-MM-DD)
 * @returns Parse result with snapshot data or errors
 */
export function parseYouTubeStudioSnapshot(
  text: string,
  snapshotDate?: string
): SnapshotParseResult {
  const warnings: string[] = [];

  // Validate size
  if (text.length > MAX_PASTE_SIZE) {
    return {
      success: false,
      errors: [`Paste too large (${text.length} bytes). Maximum: ${MAX_PASTE_SIZE} bytes`],
    };
  }

  // Sanitize and normalize
  const sanitized = text.trim();
  if (!sanitized) {
    return {
      success: false,
      errors: ['Empty paste'],
    };
  }

  // Handle CRLF and LF
  const lines = sanitized.split(/\r?\n/);

  if (lines.length === 0) {
    return {
      success: false,
      errors: ['No valid lines found'],
    };
  }

  // Find all video start indices
  const videoStartIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(VIDEO_MARKER)) {
      videoStartIndices.push(i);
    }
  }

  if (videoStartIndices.length === 0) {
    return {
      success: false,
      errors: ['No video entries found. Expected lines starting with "Video thumbnail:"'],
    };
  }

  // Parse each video section
  const data: YouTubeSnapshotRow[] = [];
  const skippedVideos: string[] = [];

  for (let idx = 0; idx < videoStartIndices.length; idx++) {
    const startLine = videoStartIndices[idx];
    const endLine = idx < videoStartIndices.length - 1
      ? videoStartIndices[idx + 1]
      : lines.length;

    const videoLines = lines.slice(startLine, endLine).filter(l => l.trim());

    const parsed = parseVideoSection(videoLines);
    if (parsed) {
      data.push(parsed);
    } else {
      // Get a short title for the warning
      const titleLine = lines[startLine];
      const shortTitle = titleLine.substring(VIDEO_MARKER.length, VIDEO_MARKER.length + 30).trim();
      skippedVideos.push(shortTitle + '...');
    }
  }

  if (skippedVideos.length > 0) {
    warnings.push(`Skipped ${skippedVideos.length} videos with parsing issues`);
  }

  if (data.length === 0) {
    return {
      success: false,
      errors: ['No valid video data could be parsed'],
    };
  }

  // Use provided date or default to today
  const date = snapshotDate || new Date().toISOString().split('T')[0];

  const snapshot: YouTubeSnapshot = {
    snapshotDate: date,
    captureTimestamp: Date.now(),
    data,
    source: 'manual-paste',
  };

  return {
    success: true,
    snapshot,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse a single video section (multi-line format)
 *
 * Expected line order (after filtering empty lines):
 * 0: "Video thumbnail: [title]"
 * 1: duration (e.g., "1:58")
 * 2: title (repeated without prefix)
 * 3: views (e.g., "2,320")
 * 4: views % (e.g., "18.4%")
 * 5: watch time hours (e.g., "9.9")
 * 6: watch time % (e.g., "5.7%")
 * 7: subscribers (e.g., "0" or "-1")
 * 8: subscribers % (e.g., "0%" or "-50%")
 * 9: revenue (e.g., "$1.25" or "—")
 * 10: revenue % (e.g., "41.2%" or "—")
 * 11: impressions (e.g., "1,594")
 * 12: CTR (e.g., "6.8%")
 */
function parseVideoSection(lines: string[]): YouTubeSnapshotRow | null {
  if (lines.length < 13) {
    return null;
  }

  try {
    // Line 0: "Video thumbnail: [title]" - extract title
    const titleFromMarker = lines[0].substring(VIDEO_MARKER.length).trim();

    // Line 2: title (repeated, cleaner version)
    const title = lines[2].trim() || titleFromMarker;
    if (!title) return null;

    // Line 1: duration (e.g., "1:58" or "11:23")
    const durationStr = lines[1].trim();
    const duration = parseDuration(durationStr);

    // Line 3: views (e.g., "2,320")
    const views = parseNumber(lines[3]);
    if (views === null) return null;

    // Line 5: watch time hours (e.g., "9.9")
    const watchTimeHours = parseNumber(lines[5]);

    // Line 11: impressions (e.g., "1,594")
    const impressions = parseNumber(lines[11]);

    // Line 12: CTR (e.g., "6.8%")
    const ctr = parsePercentage(lines[12]);

    return {
      title,
      duration: duration ?? undefined,
      views,
      watchTimeHours: watchTimeHours ?? undefined,
      impressions,
      ctr,
    };
  } catch {
    return null;
  }
}

/**
 * Parse duration string to seconds
 * Examples: "1:58" → 118, "11:23" → 683, "1:02:30" → 3750
 */
function parseDuration(value: string): number | null {
  if (!value) return null;

  const parts = value.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

/**
 * Parse number from string (handles locale formats)
 * Examples: "1,234" → 1234, "1 234" → 1234
 */
function parseNumber(value: string): number | null {
  if (!value) return null;

  // Remove common separators (commas, spaces)
  const normalized = value.replace(/[,\s]/g, '');

  const num = Number(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Parse percentage to decimal
 * Examples: "4.5%" → 0.045, "10" → 0.10, "0.045" → 0.045
 */
function parsePercentage(value: string): number | null {
  if (!value) return null;

  // Remove % sign and spaces
  const normalized = value.replace(/[%\s]/g, '');

  const num = Number(normalized);
  if (isNaN(num)) return null;

  // If value is > 1, assume it's a percentage (4.5 → 0.045)
  // Otherwise assume it's already decimal (0.045 → 0.045)
  return num > 1 ? num / 100 : num;
}

/**
 * Validate snapshot data
 */
export function validateSnapshot(snapshot: YouTubeSnapshot): string[] {
  const errors: string[] = [];

  if (!snapshot.snapshotDate) {
    errors.push('Missing snapshot date');
  }

  if (!snapshot.captureTimestamp) {
    errors.push('Missing capture timestamp');
  }

  if (!Array.isArray(snapshot.data) || snapshot.data.length === 0) {
    errors.push('Empty or invalid data array');
  }

  // Check for duplicate titles
  const titles = new Set<string>();
  const duplicates: string[] = [];

  for (const row of snapshot.data) {
    if (titles.has(row.title)) {
      duplicates.push(row.title);
    }
    titles.add(row.title);
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate titles found: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`);
  }

  return errors;
}
