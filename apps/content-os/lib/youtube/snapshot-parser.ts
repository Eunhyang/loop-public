/**
 * YouTube Studio Snapshot Parser
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * Parses YouTube Studio "Last 7 days" clipboard data
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
 * Expected column headers (case-insensitive)
 */
const EXPECTED_HEADERS = ['title', 'views', 'impressions', 'ctr'];

/**
 * Parse YouTube Studio clipboard text
 *
 * Expected formats:
 * - Title\tViews\tImpressions\tCTR (%)
 * - Title\tViews (impressions/CTR may be absent)
 *
 * @param text - Raw clipboard text from YouTube Studio
 * @param snapshotDate - Date for this snapshot (ISO format YYYY-MM-DD)
 * @returns Parse result with snapshot data or errors
 */
export function parseYouTubeStudioSnapshot(
  text: string,
  snapshotDate?: string
): SnapshotParseResult {
  const errors: string[] = [];
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
  const lines = sanitized.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      success: false,
      errors: ['No valid lines found'],
    };
  }

  // Detect header row (optional, YouTube Studio may include it)
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  const isHeaderRow = EXPECTED_HEADERS.some((header) => firstLine.includes(header));

  if (isHeaderRow) {
    startIndex = 1;
    warnings.push('Header row detected and skipped');
  }

  // Parse data rows
  const data: YouTubeSnapshotRow[] = [];
  const skippedRows: number[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split('\t');

    // Validate column count (minimum 2: title + views)
    if (columns.length < 2) {
      skippedRows.push(i + 1);
      continue;
    }

    const title = columns[0].trim();
    if (!title) {
      skippedRows.push(i + 1);
      continue;
    }

    // Parse views (required)
    const views = parseNumber(columns[1]);
    if (views === null) {
      skippedRows.push(i + 1);
      continue;
    }

    // Parse impressions (optional)
    const impressions = columns.length >= 3 ? parseNumber(columns[2]) : null;

    // Parse CTR (optional, may be percentage like "4.5%")
    const ctr = columns.length >= 4 ? parsePercentage(columns[3]) : null;

    data.push({
      title,
      views,
      impressions,
      ctr,
    });
  }

  if (skippedRows.length > 0) {
    warnings.push(`Skipped ${skippedRows.length} malformed rows: lines ${skippedRows.join(', ')}`);
  }

  if (data.length === 0) {
    return {
      success: false,
      errors: ['No valid data rows found'],
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
