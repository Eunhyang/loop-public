/**
 * Data Layer - API Client
 *
 * Infrastructure layer for external API communication
 * Depends on: Domain types, HTTP service
 */

import { httpClient } from '@/services/http';
import type { GlobalAuditResponse } from '../domain/types';

/**
 * Activity API Client
 * Handles all HTTP requests for activity/audit data
 */
export const activityApi = {
  /**
   * Fetches global audit log entries
   *
   * @param limit - Maximum number of entries to fetch (default: 50)
   * @returns Promise with audit log data
   */
  getGlobalAuditLog: (limit: number = 50) =>
    httpClient.get<GlobalAuditResponse>(`/api/audit?limit=${limit}`)
};
