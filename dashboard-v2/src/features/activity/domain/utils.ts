/**
 * Domain Layer - Utils
 *
 * Pure business logic functions
 * NOTE: Uses date-fns as infrastructure dependency (accepted for date operations)
 */

import { isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AuditLogEntry, TimeGroup } from './types';

/**
 * Groups audit logs by time periods (Today, Yesterday, This Week, etc.)
 * Pure function with no side effects
 *
 * @param logs - Array of audit log entries
 * @returns Array of time-grouped logs with labels
 */
export function groupByDate(logs: AuditLogEntry[]): TimeGroup[] {
  const groups: TimeGroup[] = [];

  logs.forEach(log => {
    const date = new Date(log.timestamp);
    let label: string;

    // Determine time group label
    if (isToday(date)) {
      label = '오늘';
    } else if (isYesterday(date)) {
      label = '어제';
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      label = '이번 주';
    } else {
      label = format(date, 'M월 d일', { locale: ko });
    }

    // Find or create group
    const existing = groups.find(g => g.label === label);
    if (existing) {
      existing.items.push(log);
    } else {
      groups.push({ label, items: [log] });
    }
  });

  return groups;
}

/**
 * Formats timestamp as relative time (e.g., "3분 전", "1시간 전")
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted relative time string in Korean
 */
export function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
